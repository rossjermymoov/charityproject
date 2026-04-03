import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateSOFA } from "@/lib/sorp-reports";

/**
 * POST /api/finance/reports/generate-sofa
 * Generate a Statement of Financial Activities (SOFA) report
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate, name } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { error: "startDate must be before endDate" },
        { status: 400 }
      );
    }

    // Generate SOFA data
    const sofaData = await generateSOFA(start, end);

    // Extract financial year from the period
    const financialYear = sofaData.period.financialYear;

    // Create report record
    const report = await prisma.financialReport.create({
      data: {
        name:
          name ||
          `SOFA Report ${financialYear}`,
        type: "SOFA",
        financialYear,
        startDate: start,
        endDate: end,
        data: sofaData,
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
    console.error("Error generating SOFA:", error);
    return NextResponse.json(
      { error: "Failed to generate SOFA report" },
      { status: 500 }
    );
  }
}
