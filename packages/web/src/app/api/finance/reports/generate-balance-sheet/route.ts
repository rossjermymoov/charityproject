import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateBalanceSheet } from "@/lib/sorp-reports";

/**
 * POST /api/finance/reports/generate-balance-sheet
 * Generate a Balance Sheet report
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { asOfDate, name } = body;

    if (!asOfDate) {
      return NextResponse.json(
        { error: "asOfDate is required" },
        { status: 400 }
      );
    }

    const date = new Date(asOfDate);
    if (date > new Date()) {
      return NextResponse.json(
        { error: "asOfDate cannot be in the future" },
        { status: 400 }
      );
    }

    // Generate Balance Sheet data
    const balanceSheetData = await generateBalanceSheet(date);

    // Determine financial year (assumes UK fiscal year: April to March)
    const month = date.getMonth();
    const year = date.getFullYear();
    const financialYear =
      month >= 3
        ? `${year}-${(year + 1).toString().slice(-2)}`
        : `${year - 1}-${year.toString().slice(-2)}`;

    // Create report record
    const report = await prisma.financialReport.create({
      data: {
        name: name || `Balance Sheet as at ${date.toLocaleDateString()}`,
        type: "BALANCE_SHEET",
        financialYear,
        startDate: date,
        endDate: date,
        data: balanceSheetData,
        status: "DRAFT",
        generatedById: session.id,
        generatedAt: new Date(),
      },
      include: {
        generatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error generating Balance Sheet:", error);
    return NextResponse.json(
      { error: "Failed to generate Balance Sheet report" },
      { status: 500 }
    );
  }
}
