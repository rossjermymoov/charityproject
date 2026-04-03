import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/tags
 * Get all available tags for filtering
 */
export async function GET(req: NextRequest): Promise<NextResponse<any>> {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        colour: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
