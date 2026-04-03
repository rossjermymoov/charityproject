import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const pledge = await prisma.pledge.findUnique({
      where: { id },
      include: {
        contact: true,
        campaign: true,
        createdBy: { select: { id: true, name: true, email: true } },
        payments: {
          include: {
            donation: true,
          },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!pledge) {
      return NextResponse.json({ error: "Pledge not found" }, { status: 404 });
    }

    return NextResponse.json(pledge);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch pledge" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const {
      amount,
      currency,
      frequency,
      startDate,
      endDate,
      status,
      reminderFrequency,
      notes,
      nextReminderDate,
      totalPledged,
      totalFulfilled,
    } = body;

    const pledge = await prisma.pledge.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(currency && { currency }),
        ...(frequency && { frequency }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(status && { status }),
        ...(reminderFrequency !== undefined && { reminderFrequency }),
        ...(notes !== undefined && { notes }),
        ...(nextReminderDate && {
          nextReminderDate: new Date(nextReminderDate),
        }),
        ...(totalPledged !== undefined && {
          totalPledged: parseFloat(totalPledged),
        }),
        ...(totalFulfilled !== undefined && {
          totalFulfilled: parseFloat(totalFulfilled),
        }),
      },
      include: {
        contact: true,
        campaign: true,
        createdBy: { select: { id: true, name: true } },
        payments: true,
      },
    });

    return NextResponse.json(pledge);
  } catch (error) {
    console.error("Pledge update error:", error);
    return NextResponse.json(
      { error: "Failed to update pledge" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    // Delete all related payments first
    await prisma.pledgePayment.deleteMany({
      where: { pledgeId: id },
    });

    // Delete the pledge
    await prisma.pledge.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pledge delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete pledge" },
      { status: 500 }
    );
  }
}
