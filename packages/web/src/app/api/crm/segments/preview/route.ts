import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { buildSegmentWhere, validateSegmentFilters } from "@/lib/segment-builder";
import type { SegmentFilters } from "@/types/segment";

/**
 * POST /api/crm/segments/preview
 * Preview contacts matching criteria without saving
 */
export async function POST(req: NextRequest): Promise<NextResponse<any>> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { filters } = body;

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

    const where = buildSegmentWhere(filters as SegmentFilters);

    // Get matching contacts
    const contacts = await prisma.contact.findMany({
      where: {
        ...where,
        status: "ACTIVE",
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
      take: 100, // Limit preview to 100 contacts
    });

    return NextResponse.json({
      count: contacts.length,
      contacts,
    });
  } catch (error) {
    console.error("Error previewing segment:", error);
    return NextResponse.json(
      { error: "Failed to preview segment" },
      { status: 500 }
    );
  }
}
