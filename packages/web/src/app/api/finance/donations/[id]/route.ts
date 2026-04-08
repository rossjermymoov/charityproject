import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.donation.findUnique({
    where: { id },
    select: { amount: true, campaignId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  }

  // Build update data from provided fields only
  const data: Record<string, unknown> = {};
  if (body.contactId !== undefined) data.contactId = body.contactId;
  if (body.amount !== undefined) data.amount = parseFloat(body.amount);
  if (body.type !== undefined) data.type = body.type;
  if (body.method !== undefined) data.method = body.method || null;
  if (body.reference !== undefined) data.reference = body.reference || null;
  if (body.date !== undefined) data.date = new Date(body.date);
  if (body.ledgerCodeId !== undefined) data.ledgerCodeId = body.ledgerCodeId || null;
  if (body.campaignId !== undefined) data.campaignId = body.campaignId || null;
  if (body.eventId !== undefined) data.eventId = body.eventId || null;
  if (body.isGiftAidable !== undefined) data.isGiftAidable = !!body.isGiftAidable;
  if (body.notes !== undefined) data.notes = body.notes || null;

  const updated = await prisma.donation.update({
    where: { id },
    data,
    include: {
      contact: { select: { firstName: true, lastName: true, donorId: true } },
      ledgerCode: { select: { code: true, name: true } },
    },
  });

  // Handle campaign total changes if amount or campaign changed
  if (body.amount !== undefined || body.campaignId !== undefined) {
    if (existing.campaignId) {
      await prisma.campaign.update({
        where: { id: existing.campaignId },
        data: { actualRaised: { decrement: existing.amount } },
      });
    }
    const newCampaignId = body.campaignId !== undefined ? body.campaignId : existing.campaignId;
    const newAmount = body.amount !== undefined ? parseFloat(body.amount) : existing.amount;
    if (newCampaignId) {
      await prisma.campaign.update({
        where: { id: newCampaignId },
        data: { actualRaised: { increment: newAmount } },
      });
    }
  }

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "Donation",
    entityId: id,
    details: data,
  });

  return NextResponse.json({
    id: updated.id,
    contactId: updated.contactId,
    contactName: `${updated.contact.firstName} ${updated.contact.lastName}`,
    donorId: updated.contact.donorId,
    amount: updated.amount,
    type: updated.type,
    method: updated.method,
    reference: updated.reference,
    date: updated.date.toISOString(),
    ledgerCode: updated.ledgerCode ? updated.ledgerCode.code : null,
    isGiftAidable: updated.isGiftAidable,
  });
}
