import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const partnership = await prisma.corporatePartnership.findUnique({
      where: { id },
    });

    if (!partnership) {
      return NextResponse.json({ error: "Partnership not found" }, { status: 404 });
    }

    const activities = await prisma.partnershipActivity.findMany({
      where: { partnershipId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching partnership activities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const partnership = await prisma.corporatePartnership.findUnique({
      where: { id },
    });

    if (!partnership) {
      return NextResponse.json({ error: "Partnership not found" }, { status: 404 });
    }

    const activity = await prisma.partnershipActivity.create({
      data: {
        partnershipId: id,
        type: body.type,
        date: new Date(body.date),
        description: body.description || null,
        userId: session.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating partnership activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
