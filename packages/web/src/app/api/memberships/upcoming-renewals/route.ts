import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { getUpcomingRenewals } from "@/lib/membership-renewal";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const searchParams = req.nextUrl.searchParams;
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: "Days must be between 1 and 365" },
        { status: 400 }
      );
    }

    const renewals = await getUpcomingRenewals(days);

    return NextResponse.json(renewals, { status: 200 });
  } catch (error) {
    console.error("Error fetching upcoming renewals:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming renewals" },
      { status: 500 }
    );
  }
}
