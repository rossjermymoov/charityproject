import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const funds = await prisma.fund.findMany({
      where: { isActive: true },
    });

    const summary = {
      totalBalance: funds.reduce((sum, fund) => sum + fund.balance, 0),
      fundCount: funds.length,
      byType: {
        UNRESTRICTED: 0,
        RESTRICTED: 0,
        ENDOWMENT: 0,
      },
      funds: funds,
    };

    // Calculate balance by fund type
    funds.forEach((fund) => {
      const type = fund.type as keyof typeof summary.byType;
      if (type in summary.byType) {
        summary.byType[type] += fund.balance;
      }
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching fund summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch fund summary" },
      { status: 500 }
    );
  }
}
