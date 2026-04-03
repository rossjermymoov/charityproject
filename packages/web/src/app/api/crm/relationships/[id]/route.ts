import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const relationship = await prisma.contactRelationship.findUnique({
      where: { id },
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

    if (!relationship) {
      return NextResponse.json(
        { error: "Relationship not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(relationship);
  } catch (error) {
    console.error("Error fetching relationship:", error);
    return NextResponse.json(
      { error: "Failed to fetch relationship" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { type, description } = body;

    const relationship = await prisma.contactRelationship.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(description !== undefined && { description }),
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

    return NextResponse.json(relationship);
  } catch (error: unknown) {
    console.error("Error updating relationship:", error);

    if (
      error instanceof Error &&
      error.message.includes("An operation failed")
    ) {
      return NextResponse.json(
        { error: "Relationship not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update relationship" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.contactRelationship.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting relationship:", error);

    if (
      error instanceof Error &&
      error.message.includes("An operation failed")
    ) {
      return NextResponse.json(
        { error: "Relationship not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete relationship" },
      { status: 500 }
    );
  }
}
