import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAuth();

    // Fetch pending payments
    const payments = await prisma.payment.findMany({
      where: { status: "PENDING" },
      include: { contact: true },
      take: 1000,
    });

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        contactName: `${p.contact?.firstName || ""} ${p.contact?.lastName || ""}`.trim(),
        contactEmail: p.contact?.email || "",
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt,
      })),
      paymentRuns: [],
    });
  } catch (error) {
    console.error("BACS pending fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending payments" },
      { status: 500 }
    );
  }
}
