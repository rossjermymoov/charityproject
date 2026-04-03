import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const rule = await prisma.taskRule.findUnique({
      where: { id },
      include: {
        assignToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        autoTasks: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!rule) {
      return NextResponse.json(
        { error: "Task rule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Error fetching task rule:", error);
    return NextResponse.json(
      { error: "Failed to fetch task rule" },
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

    // Check rule exists
    const existing = await prisma.taskRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Task rule not found" },
        { status: 404 }
      );
    }

    // Validate that either assignToUserId or assignToRole is provided if updating assignment
    if (
      (body.assignToUserId !== undefined || body.assignToRole !== undefined) &&
      !body.assignToUserId &&
      !body.assignToRole
    ) {
      return NextResponse.json(
        { error: "Must specify either assignToUserId or assignToRole" },
        { status: 400 }
      );
    }

    const rule = await prisma.taskRule.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.triggerEvent && { triggerEvent: body.triggerEvent }),
        ...(body.conditions && { conditions: body.conditions }),
        ...(body.assignToUserId !== undefined && { assignToUserId: body.assignToUserId }),
        ...(body.assignToRole !== undefined && { assignToRole: body.assignToRole }),
        ...(body.taskTitle && { taskTitle: body.taskTitle }),
        ...(body.taskDescription !== undefined && { taskDescription: body.taskDescription }),
        ...(body.dueDays !== undefined && { dueDays: body.dueDays }),
        ...(body.priority && { priority: body.priority }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: {
        assignToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Error updating task rule:", error);
    return NextResponse.json(
      { error: "Failed to update task rule" },
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

    // Check rule exists
    const rule = await prisma.taskRule.findUnique({ where: { id } });
    if (!rule) {
      return NextResponse.json(
        { error: "Task rule not found" },
        { status: 404 }
      );
    }

    await prisma.taskRule.delete({ where: { id } });

    return NextResponse.json(
      { success: true, message: "Task rule deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting task rule:", error);
    return NextResponse.json(
      { error: "Failed to delete task rule" },
      { status: 500 }
    );
  }
}
