import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const firstName = searchParams.get("firstName");
  const lastName = searchParams.get("lastName");

  if (!email || !firstName || !lastName) {
    return NextResponse.json({ hasGiftAid: false });
  }

  // Find existing contact by email and name match
  const contact = await prisma.contact.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
    },
    include: {
      giftAids: {
        where: { status: "ACTIVE" },
        take: 1,
      },
    },
  });

  if (contact && contact.giftAids.length > 0) {
    return NextResponse.json({ hasGiftAid: true, contactId: contact.id });
  }

  return NextResponse.json({ hasGiftAid: false, contactId: contact?.id || null });
}
