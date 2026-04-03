import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Decimal } from "@prisma/client/runtime/library";

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
      include: {
        organisation: {
          select: { id: true, name: true, email: true, phone: true },
        },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        activities: {
          orderBy: { date: "desc" },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!partnership) {
      return NextResponse.json({ error: "Partnership not found" }, { status: 404 });
    }

    return NextResponse.json(partnership);
  } catch (error) {
    console.error("Error fetching partnership:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const updateData: Record<string, unknown> = {};
    if (body.type !== undefined) updateData.type = body.type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.annualValue !== undefined) updateData.annualValue = body.annualValue ? new Decimal(body.annualValue) : null;
    if (body.totalValue !== undefined) updateData.totalValue = body.totalValue ? new Decimal(body.totalValue) : null;
    if (body.contactId !== undefined) updateData.contactId = body.contactId || null;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.benefits !== undefined) updateData.benefits = body.benefits;
    if (body.renewalDate !== undefined) updateData.renewalDate = body.renewalDate ? new Date(body.renewalDate) : null;

    const updated = await prisma.corporatePartnership.update({
      where: { id },
      data: updateData,
      include: {
        organisation: {
          select: { id: true, name: true },
        },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating partnership:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await prisma.corporatePartnership.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting partnership:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
