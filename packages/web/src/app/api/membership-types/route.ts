import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const membershipTypes = await prisma.membershipType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        benefits: true,
        isActive: true,
      },
    });

    return NextResponse.json(membershipTypes);
  } catch (error) {
    console.error("Error fetching membership types:", error);
    return NextResponse.json(
      { error: "Failed to fetch membership types" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await req.json();
    const { name, description, price, duration, benefits } = body;

    if (!name || price === undefined || !duration) {
      return NextResponse.json(
        { error: "Missing required fields: name, price, duration" },
        { status: 400 }
      );
    }

    // Get the next sort order
    const lastType = await prisma.membershipType.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const nextSortOrder = (lastType?.sortOrder || 0) + 1;

    const membershipType = await prisma.membershipType.create({
      data: {
        name,
        description: description || null,
        price,
        duration,
        benefits: benefits ? JSON.stringify(benefits) : null,
        sortOrder: nextSortOrder,
      },
    });

    return NextResponse.json(membershipType, { status: 201 });
  } catch (error) {
    console.error("Error creating membership type:", error);
    return NextResponse.json(
      { error: "Failed to create membership type" },
      { status: 500 }
    );
  }
}
