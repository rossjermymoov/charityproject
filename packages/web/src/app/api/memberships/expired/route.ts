import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { getExpiredMemberships } from "@/lib/membership-renewal";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const expired = await getExpiredMemberships();

    return NextResponse.json(expired, { status: 200 });
  } catch (error) {
    console.error("Error fetching expired memberships:", error);
    return NextResponse.json(
      { error: "Failed to fetch expired memberships" },
      { status: 500 }
    );
  }
}
