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

    // Verify contact exists
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Get all relationships where this contact is the "from" contact
    const relationshipsFrom = await prisma.contactRelationship.findMany({
      where: { fromContactId: id },
      include: {
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

    // Get all relationships where this contact is the "to" contact
    const relationshipsTo = await prisma.contactRelationship.findMany({
      where: { toContactId: id },
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
      },
      orderBy: { createdAt: "desc" },
    });

    // Combine and structure the response
    const allRelationships = [
      ...relationshipsFrom.map((rel) => ({
        ...rel,
        relatedContact: rel.toContact,
        direction: "outgoing" as const,
      })),
      ...relationshipsTo.map((rel) => ({
        ...rel,
        relatedContact: rel.fromContact,
        direction: "incoming" as const,
      })),
    ];

    return NextResponse.json({
      contactId: id,
      relationships: allRelationships,
      relationshipsFrom: relationshipsFrom,
      relationshipsTo: relationshipsTo,
    });
  } catch (error) {
    console.error("Error fetching contact relationships:", error);
    return NextResponse.json(
      { error: "Failed to fetch relationships" },
      { status: 500 }
    );
  }
}
