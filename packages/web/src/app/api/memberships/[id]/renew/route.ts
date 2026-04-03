import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { renewMembership } from "@/lib/membership-renewal";

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const params = await props.params;
    const membershipId = params.id;

    if (!membershipId) {
      return NextResponse.json(
        { error: "Membership ID is required" },
        { status: 400 }
      );
    }

    await renewMembership(membershipId);

    return NextResponse.json(
      { success: true, message: "Membership renewed successfully" },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to renew membership";

    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      );
    }

    if (errorMessage.includes("does not have auto-renewal")) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    console.error("Error renewing membership:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
