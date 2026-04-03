import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const rules = await prisma.taskRule.findMany({
      include: {
        assignToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        autoTasks: {
          select: {
            id: true,
          },
          take: 0,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching task rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch task rules" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.triggerEvent || !body.taskTitle) {
      return NextResponse.json(
        { error: "Missing required fields: name, triggerEvent, taskTitle" },
        { status: 400 }
      );
    }

    // Validate that either assignToUserId or assignToRole is provided
    if (!body.assignToUserId && !body.assignToRole) {
      return NextResponse.json(
        { error: "Must specify either assignToUserId or assignToRole" },
        { status: 400 }
      );
    }

    const rule = await prisma.taskRule.create({
      data: {
        id: randomBytes(12).toString("hex"),
        name: body.name,
        triggerEvent: body.triggerEvent,
        conditions: body.conditions || {},
        assignToUserId: body.assignToUserId || null,
        assignToRole: body.assignToRole || null,
        taskTitle: body.taskTitle,
        taskDescription: body.taskDescription || null,
        dueDays: body.dueDays || 7,
        priority: body.priority || "MEDIUM",
        isActive: body.isActive ?? true,
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

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Error creating task rule:", error);
    return NextResponse.json(
      { error: "Failed to create task rule" },
      { status: 500 }
    );
  }
}
