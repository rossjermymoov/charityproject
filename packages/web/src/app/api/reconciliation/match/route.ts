import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const body = await req.json();
    const {
      transactionId,
      donationId,
      paymentId,
      confidence,
    } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId is required" },
        { status: 400 }
      );
    }

    if (!donationId && !paymentId) {
      return NextResponse.json(
        { error: "Either donationId or paymentId is required" },
        { status: 400 }
      );
    }

    // Update transaction
    const transaction = await prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        status: "MATCHED",
        matchedDonationId: donationId,
        matchedPaymentId: paymentId,
        matchConfidence: confidence || "MEDIUM",
      },
    });

    // Update session stats
    const session = await prisma.bankTransaction.findUnique({
      where: { id: transactionId },
      select: { importBatch: true },
    });

    if (session?.importBatch) {
      const unmatchedCount = await prisma.bankTransaction.count({
        where: {
          importBatch: session.importBatch,
          status: "UNMATCHED",
        },
      });

      const matchedCount = await prisma.bankTransaction.count({
        where: {
          importBatch: session.importBatch,
          status: "MATCHED",
        },
      });

      // Find reconciliation session by import batch
      const reconciliationSession = await prisma.reconciliationSession.findFirst({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (reconciliationSession) {
        await prisma.reconciliationSession.update({
          where: { id: reconciliationSession.id },
          data: {
            matchedCount,
            unmatchedCount,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("Error matching transaction:", error);
    return NextResponse.json(
      { error: "Failed to match transaction" },
      { status: 500 }
    );
  }
}
