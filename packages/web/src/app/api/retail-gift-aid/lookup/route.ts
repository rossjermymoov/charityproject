import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const contact = await prisma.contact.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        isArchived: false,
      },
      include: {
        giftAids: {
          where: { type: "RETAIL", status: "ACTIVE" },
          select: { id: true },
        },
      },
    });

    if (contact) {
      return NextResponse.json({
        found: true,
        contact: {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          hasRetailGiftAid: contact.giftAids.length > 0,
        },
      });
    }

    return NextResponse.json({ found: false });
  } catch (error) {
    console.error("Retail Gift Aid lookup error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
