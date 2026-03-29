import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

function generateMemberNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString().slice(2, 5);
  return `MEM-${(timestamp + random).slice(-6).padStart(6, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await req.json();
    const { contactId, membershipTypeId, startDate, autoRenew } = body;

    if (!contactId || !membershipTypeId || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields: contactId, membershipTypeId, startDate" },
        { status: 400 }
      );
    }

    // Verify contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Get membership type
    const membershipType = await prisma.membershipType.findUnique({
      where: { id: membershipTypeId },
    });

    if (!membershipType) {
      return NextResponse.json({ error: "Membership type not found" }, { status: 404 });
    }

    // Calculate end date
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + membershipType.duration);

    // Generate unique member number
    let memberNumber: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      memberNumber = generateMemberNumber();
      const existing = await prisma.membership.findUnique({
        where: { memberNumber },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: "Failed to generate unique member number" },
        { status: 500 }
      );
    }

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        contactId,
        membershipTypeId,
        memberNumber: memberNumber!,
        status: "ACTIVE",
        startDate: start,
        endDate: end,
        autoRenew: autoRenew || false,
      },
      include: {
        contact: true,
        membershipType: true,
      },
    });

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    console.error("Error creating membership:", error);
    return NextResponse.json(
      { error: "Failed to create membership" },
      { status: 500 }
    );
  }
}
