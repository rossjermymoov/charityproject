import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const rules = await prisma.automationRule.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        logs: {
          take: 0,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rules);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch automation rules" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await req.json();

    const rule = await prisma.automationRule.create({
      data: {
        name: body.name,
        description: body.description,
        trigger: body.trigger,
        conditions: body.conditions || {},
        actions: body.actions || [],
        isActive: body.isActive ?? true,
        createdById: session.id,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Error creating automation rule:", error);
    return NextResponse.json(
      { error: "Failed to create automation rule" },
      { status: 500 }
    );
  }
}
