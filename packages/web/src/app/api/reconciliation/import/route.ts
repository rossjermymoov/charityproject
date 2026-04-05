import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { parseCSV } from "@/lib/csv-parser";
import { NextRequest, NextResponse } from "next/server";
import { formatDate } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bankAccount = formData.get("bankAccount") as string;
    const sessionId = formData.get("sessionId") as string;
    const columnMappingStr = formData.get("columnMapping") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    // Parse CSV
    const columnMapping = columnMappingStr ? JSON.parse(columnMappingStr) : undefined;
    const { transactions, errors, mapping } = parseCSV(content, columnMapping);

    if (transactions.length === 0) {
      return NextResponse.json(
        {
          error: "No valid transactions found",
          parseErrors: errors,
        },
        { status: 400 }
      );
    }

    // Generate import batch ID
    const importBatch = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create or update session
    let reconciliationSession;
    if (sessionId) {
      reconciliationSession = await prisma.reconciliationSession.findUnique({
        where: { id: sessionId },
      });
    } else {
      reconciliationSession = await prisma.reconciliationSession.create({
        data: {
          name: `Import ${file.name} - ${new Date().toLocaleDateString()}`,
          bankAccount,
          status: "IN_PROGRESS",
          createdById: session.id,
        },
      });
    }

    // Auto-match transactions against existing donations and payments
    const autoMatched = await autoMatchTransactions(transactions);

    // Create bank transactions with auto-matched data
    const createdTransactions = await Promise.all(
      transactions.map((txn) => {
        const matchData = autoMatched[JSON.stringify(txn)];
        return prisma.bankTransaction.create({
          data: {
            date: txn.date,
            description: txn.description,
            reference: txn.reference,
            amount: txn.amount,
            type: txn.type,
            balance: txn.balance,
            bankAccount,
            importBatch,
            status: matchData ? "MATCHED" : "UNMATCHED",
            matchedDonationId: matchData?.donationId,
            matchedPaymentId: matchData?.paymentId,
            matchConfidence: matchData?.confidence,
          },
        });
      })
    );

    // Update session stats
    const matched = createdTransactions.filter((t) => t.status === "MATCHED").length;
    const unmatched = createdTransactions.filter((t) => t.status === "UNMATCHED").length;

    if (!reconciliationSession) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    await prisma.reconciliationSession.update({
      where: { id: reconciliationSession.id },
      data: {
        totalTransactions: {
          increment: createdTransactions.length,
        },
        matchedCount: {
          increment: matched,
        },
        unmatchedCount: {
          increment: unmatched,
        },
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: reconciliationSession.id,
      importedCount: createdTransactions.length,
      matchedCount: matched,
      unmatchedCount: unmatched,
      parseErrors: errors,
      mapping,
      importBatch,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import transactions" },
      { status: 500 }
    );
  }
}

/**
 * Auto-match transactions against donations and payments
 */
async function autoMatchTransactions(
  transactions: Array<{ date: Date; description: string; amount: number; reference?: string }>
) {
  const matchedMap: Record<string, any> = {};

  for (const txn of transactions) {
    // Try exact amount match within 3 days
    const donationMatch = await prisma.donation.findFirst({
      where: {
        amount: txn.amount,
        date: {
          gte: new Date(txn.date.getTime() - 3 * 24 * 60 * 60 * 1000),
          lte: new Date(txn.date.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
      },
      take: 1,
    });

    if (donationMatch) {
      matchedMap[JSON.stringify(txn)] = {
        donationId: donationMatch.id,
        confidence: "HIGH",
      };
      continue;
    }

    // Try payment match
    const paymentMatch = await prisma.payment.findFirst({
      where: {
        amount: txn.amount,
        status: "SUCCEEDED",
        paidAt: {
          gte: new Date(txn.date.getTime() - 3 * 24 * 60 * 60 * 1000),
          lte: new Date(txn.date.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
      },
      take: 1,
    });

    if (paymentMatch) {
      matchedMap[JSON.stringify(txn)] = {
        paymentId: paymentMatch.id,
        confidence: "HIGH",
      };
      continue;
    }

    // Try reference match if available
    if (txn.reference) {
      const refMatch = await prisma.donation.findFirst({
        where: {
          reference: {
            contains: txn.reference,
            mode: "insensitive",
          },
        },
        take: 1,
      });

      if (refMatch) {
        matchedMap[JSON.stringify(txn)] = {
          donationId: refMatch.id,
          confidence: "MEDIUM",
        };
        continue;
      }
    }
  }

  return matchedMap;
}
