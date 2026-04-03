import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/events/list
 * Get all active events for filtering
 */
export async function GET(req: NextRequest): Promise<NextResponse<any>> {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: { in: ["DRAFT", "PUBLISHED", "IN_PROGRESS"] },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
