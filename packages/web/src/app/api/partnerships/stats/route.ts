import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const partnerships = await prisma.corporatePartnership.findMany({
      select: {
        id: true,
        status: true,
        type: true,
        annualValue: true,
        totalValue: true,
      },
    });

    const stats = {
      total: partnerships.length,
      byStatus: {
        PROSPECT: partnerships.filter((p) => p.status === "PROSPECT").length,
        ACTIVE: partnerships.filter((p) => p.status === "ACTIVE").length,
        LAPSED: partnerships.filter((p) => p.status === "LAPSED").length,
        ENDED: partnerships.filter((p) => p.status === "ENDED").length,
      },
      byType: {
        SPONSOR: partnerships.filter((p) => p.type === "SPONSOR").length,
        PARTNER: partnerships.filter((p) => p.type === "PARTNER").length,
        PATRON: partnerships.filter((p) => p.type === "PATRON").length,
        CORPORATE_DONOR: partnerships.filter((p) => p.type === "CORPORATE_DONOR").length,
      },
      activeCount: partnerships.filter((p) => p.status === "ACTIVE").length,
      totalAnnualValue: partnerships
        .filter((p) => p.status === "ACTIVE" && p.annualValue)
        .reduce((sum, p) => sum + (Number(p.annualValue) || 0), 0),
      totalValue: partnerships
        .reduce((sum, p) => sum + (Number(p.totalValue) || 0), 0),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching partnership stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
