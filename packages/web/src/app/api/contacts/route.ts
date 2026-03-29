import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
