import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    // Get pagination params
    const { searchParams } = new URL(req.url);
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "50");
    const status = searchParams.get("status");
    const assignedToId = searchParams.get("assignedToId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;

    const [tasks, total] = await Promise.all([
      prisma.autoTask.findMany({
        where,
        include: {
          rule: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          relatedContact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.autoTask.count({ where }),
    ]);

    return NextResponse.json({
      tasks,
      total,
      skip,
      take,
      hasMore: skip + take < total,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    // Validate required fields
    if (!body.title || !body.assignedToId) {
      return NextResponse.json(
        { error: "Missing required fields: title, assignedToId" },
        { status: 400 }
      );
    }

    // Calculate due date if dueDays provided
    let dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (!dueDate && body.dueDays) {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + body.dueDays);
    }

    const task = await prisma.autoTask.create({
      data: {
        id: randomBytes(12).toString("hex"),
        ruleId: body.ruleId || null,
        title: body.title,
        description: body.description || null,
        assignedToId: body.assignedToId,
        status: body.status || "PENDING",
        priority: body.priority || "MEDIUM",
        dueDate,
        relatedContactId: body.relatedContactId || null,
        relatedDonationId: body.relatedDonationId || null,
      },
      include: {
        rule: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        relatedContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
