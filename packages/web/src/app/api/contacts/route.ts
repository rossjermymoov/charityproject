import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const contacts = await prisma.contact.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: { lastName: "asc" },
      take: 500,
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
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
    const { firstName, lastName, email, addressLine1, postcode } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        addressLine1: addressLine1 || null,
        postcode: postcode || null,
        createdById: session.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
