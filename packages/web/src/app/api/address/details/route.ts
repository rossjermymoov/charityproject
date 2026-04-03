import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAddressDetails } from "@/lib/loqate";

/**
 * GET /api/address/details?id=...
 * Get full details for a specific address
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid query parameter 'id'" },
      { status: 400 }
    );
  }

  try {
    const details = await getAddressDetails(id);

    if (!details) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(details);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching address details:", message);
    return NextResponse.json(
      { error: "Failed to fetch address details" },
      { status: 500 }
    );
  }
}
