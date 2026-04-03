import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { buildSegmentWhere, validateSegmentFilters } from "@/lib/segment-builder";
import type { SegmentFilters } from "@/types/segment";

/**
 * GET /api/crm/segments/[id]
 * Get a saved segment and its matching contacts
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<any>> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const segment = await prisma.savedSegment.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        filters: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    // Check authorization: user must be the creator
    if (segment.createdById !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const filters = JSON.parse(segment.filters) as SegmentFilters;
    const where = buildSegmentWhere(filters);

    // Get matching contacts
    const contacts = await prisma.contact.findMany({
      where: {
        ...where,
        status: "ACTIVE", // Only active contacts
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        city: true,
        postcode: true,
      },
      orderBy: { createdAt: "desc" },
      take: 1000, // Limit results
    });

    return NextResponse.json({
      ...segment,
      filters,
      contactCount: contacts.length,
      contacts,
    });
  } catch (error) {
    console.error("Error fetching segment:", error);
    return NextResponse.json(
      { error: "Failed to fetch segment" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/crm/segments/[id]
 * Update a saved segment
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<any>> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, filters } = body;

    // Get existing segment to check authorization
    const existing = await prisma.savedSegment.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    if (existing.createdById !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Validate new filters if provided
    if (filters) {
      const validationErrors = validateSegmentFilters(filters as SegmentFilters);
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: "Invalid segment filters", details: validationErrors },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.savedSegment.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(filters && { filters: JSON.stringify(filters) }),
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

    return NextResponse.json({
      ...updated,
      filters: JSON.parse(updated.filters),
    });
  } catch (error) {
    console.error("Error updating segment:", error);
    return NextResponse.json(
      { error: "Failed to update segment" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crm/segments/[id]
 * Delete a saved segment
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<any>> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get existing segment to check authorization
    const existing = await prisma.savedSegment.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    if (existing.createdById !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.savedSegment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting segment:", error);
    return NextResponse.json(
      { error: "Failed to delete segment" },
      { status: 500 }
    );
  }
}
