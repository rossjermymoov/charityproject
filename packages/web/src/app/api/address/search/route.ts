import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { searchAddress } from "@/lib/loqate";

/**
 * GET /api/address/search?q=...
 * Search for addresses matching the query
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
  const query = searchParams.get("q");

  if (!query || typeof query !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid query parameter 'q'" },
      { status: 400 }
    );
  }

  if (query.trim().length === 0) {
    return NextResponse.json([]);
  }

  try {
    const results = await searchAddress(query.trim());
    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error searching addresses:", message);
    return NextResponse.json(
      { error: "Failed to search addresses" },
      { status: 500 }
    );
  }
}
