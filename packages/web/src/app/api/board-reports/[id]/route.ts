import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const report = await prisma.boardReport.findUnique({
    where: { id },
    include: {
      generatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.boardReport.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.narrative !== undefined) updateData.narrative = body.narrative;
  if (body.status !== undefined) updateData.status = body.status;

  const report = await prisma.boardReport.update({
    where: { id },
    data: updateData,
    include: {
      generatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(report);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.boardReport.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  await prisma.boardReport.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
