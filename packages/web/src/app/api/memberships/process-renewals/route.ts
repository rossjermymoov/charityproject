import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { processAutoRenewals } from "@/lib/membership-renewal";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const result = await processAutoRenewals();

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error processing auto-renewals:", error);
    return NextResponse.json(
      { error: "Failed to process auto-renewals" },
      { status: 500 }
    );
  }
}
