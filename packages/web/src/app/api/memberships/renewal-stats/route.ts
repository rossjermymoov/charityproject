import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { getRenewalStats } from "@/lib/membership-renewal";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const stats = await getRenewalStats();

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("Error fetching renewal stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch renewal statistics" },
      { status: 500 }
    );
  }
}
