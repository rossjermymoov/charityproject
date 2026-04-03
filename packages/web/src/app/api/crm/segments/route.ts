import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { SegmentFilters } from "@/types/segment";
import { validateSegmentFilters, buildSegmentWhere } from "@/lib/segment-builder";

/**
 * GET /api/crm/segments
 * List all saved segments for the current user's organization
 */
export async function GET(req: NextRequest): Promise<NextResponse<any>> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const segments = await prisma.savedSegment.findMany({
      where: {
        createdById: session.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        filters: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const parsedSegments = segments.map((segment) => ({
      ...segment,
      filters: JSON.parse(segment.filters),
    }));

    return NextResponse.json(parsedSegments);
  } catch (error) {
    console.error("Error fetching segments:", error);
    return NextResponse.json(
      { error: "Failed to fetch segments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crm/segments
 * Create a new saved segment
 */
export async function POST(req: NextRequest): Promise<NextResponse<any>> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, filters } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Segment name is required" },
        { status: 400 }
      );
    }

    if (!filters || typeof filters !== "object") {
      return NextResponse.json(
        { error: "Segment filters are required" },
        { status: 400 }
      );
    }

    // Validate filters
    const validationErrors = validateSegmentFilters(filters as SegmentFilters);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Invalid segment filters", details: validationErrors },
        { status: 400 }
      );
    }

    const segment = await prisma.savedSegment.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        filters: JSON.stringify(filters),
        createdById: session.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        filters: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        ...segment,
        filters: JSON.parse(segment.filters),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating segment:", error);
    return NextResponse.json(
      { error: "Failed to create segment" },
      { status: 500 }
    );
  }
}
