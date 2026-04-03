import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fromContactId = searchParams.get("fromContactId");
    const toContactId = searchParams.get("toContactId");

    const relationships = await prisma.contactRelationship.findMany({
      where: {
        ...(fromContactId && { fromContactId }),
        ...(toContactId && { toContactId }),
      },
      include: {
        fromContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        toContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(relationships);
  } catch (error) {
    console.error("Error fetching relationships:", error);
    return NextResponse.json(
      { error: "Failed to fetch relationships" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fromContactId, toContactId, type, description } = body;

    // Validate required fields
    if (!fromContactId || !toContactId || !type) {
      return NextResponse.json(
        { error: "Missing required fields: fromContactId, toContactId, type" },
        { status: 400 }
      );
    }

    // Prevent self-relationships
    if (fromContactId === toContactId) {
      return NextResponse.json(
        { error: "Cannot create relationship to self" },
        { status: 400 }
      );
    }

    // Verify both contacts exist
    const [fromContact, toContact] = await Promise.all([
      prisma.contact.findUnique({ where: { id: fromContactId } }),
      prisma.contact.findUnique({ where: { id: toContactId } }),
    ]);

    if (!fromContact || !toContact) {
      return NextResponse.json(
        { error: "One or both contacts not found" },
        { status: 404 }
      );
    }

    const relationship = await prisma.contactRelationship.create({
      data: {
        fromContactId,
        toContactId,
        type,
        description: description || null,
      },
      include: {
        fromContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        toContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(relationship, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating relationship:", error);

    // Handle unique constraint violation
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return NextResponse.json(
        { error: "Relationship of this type already exists between these contacts" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create relationship" },
      { status: 500 }
    );
  }
}
