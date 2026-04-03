import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getReminderStats } from "@/lib/renewal-reminders";

/**
 * GET /api/memberships/reminder-stats?period=week
 * Get statistics on sent reminders (today, week, or month).
 * Requires authentication.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const period = (searchParams.get("period") || "week") as
      | "today"
      | "week"
      | "month";

    // Validate period
    if (!["today", "week", "month"].includes(period)) {
      return NextResponse.json(
        { error: "Invalid period. Must be 'today', 'week', or 'month'." },
        { status: 400 }
      );
    }

    const stats = await getReminderStats(period);

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching reminder stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch reminder statistics",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
