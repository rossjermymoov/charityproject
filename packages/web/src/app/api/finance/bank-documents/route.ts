import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { logAudit } from "@/lib/audit";

// POST: create a new bank document (auto session start)
export async function POST(req: NextRequest) {
  const session = await requireAuth();

  const today = new Date();
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
  const prefix = `BD-${dateStr}`;

  const existing = await prisma.bankDocument.count({
    where: { reference: { startsWith: prefix } },
  });

  const ref = `${prefix}-${String(existing + 1).padStart(3, "0")}`;

  const doc = await prisma.bankDocument.create({
    data: {
      reference: ref,
      date: today,
      createdById: session.id,
    },
  });

  await logAudit({
    userId: session.id,
    action: "CREATE",
    entityType: "BankDocument",
    entityId: doc.id,
    details: { reference: ref },
  });

  return NextResponse.json({ id: doc.id, reference: doc.reference });
}

// PATCH: close/submit a bank document
export async function PATCH(req: NextRequest) {
  const session = await requireAuth();
  const body = await req.json();
  const { id, status } = body;

  if (!id || !["SUBMITTED", "CLOSED"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await prisma.bankDocument.update({
    where: { id },
    data: { status },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "BankDocument",
    entityId: id,
    details: { status },
  });

  return NextResponse.json({ ok: true });
}
