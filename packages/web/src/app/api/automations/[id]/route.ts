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

    const rule = await prisma.automationRule.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        logs: { take: 20, orderBy: { executedAt: "desc" } },
      },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rule" }, { status: 500 });
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

    const rule = await prisma.automationRule.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        trigger: body.trigger,
        conditions: body.conditions,
        actions: body.actions,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    await prisma.automationLog.deleteMany({ where: { ruleId: id } });
    await prisma.automationRule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
