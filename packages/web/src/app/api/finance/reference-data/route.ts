import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(req: NextRequest) {
  await requireAuth();

  const type = req.nextUrl.searchParams.get("type");

  switch (type) {
    case "campaigns": {
      const data = await prisma.campaign.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, ledgerCodeId: true },
      });
      return NextResponse.json(data);
    }
    case "ledger-codes": {
      const data = await prisma.ledgerCode.findMany({
        where: { isActive: true },
        orderBy: { code: "asc" },
        select: { id: true, code: true, name: true },
      });
      return NextResponse.json(data);
    }
    case "events": {
      const data = await prisma.event.findMany({
        where: { status: { not: "CANCELLED" } },
        orderBy: { startDate: "desc" },
        select: { id: true, name: true },
      });
      return NextResponse.json(data);
    }
    case "payment-methods": {
      const data = await prisma.paymentMethod.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true },
      });
      return NextResponse.json(data);
    }
    case "donation-types": {
      const data = await prisma.donationType.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, label: true, isGiftAidEligible: true, defaultLedgerCodeId: true },
      });
      return NextResponse.json(data);
    }
    default:
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }
}
