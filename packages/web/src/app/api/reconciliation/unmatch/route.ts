import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const body = await req.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId is required" },
        { status: 400 }
      );
    }

    // Update transaction
    const transaction = await prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        status: "UNMATCHED",
        matchedDonationId: null,
        matchedPaymentId: null,
        matchConfidence: null,
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

      // Find reconciliation session
      const reconciliationSession = await prisma.reconciliationSession.findFirst({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
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
    console.error("Error unmatching transaction:", error);
    return NextResponse.json(
      { error: "Failed to unmatch transaction" },
      { status: 500 }
    );
  }
}
