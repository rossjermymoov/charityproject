import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (status) where.status = status;

  const reports = await prisma.boardReport.findMany({
    where,
    include: {
      generatedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, type, period, startDate, endDate, data, narrative } = body;

  if (!title || !type || !period || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing required fields: title, type, period, startDate, endDate" },
      { status: 400 }
    );
  }

  const report = await prisma.boardReport.create({
    data: {
      title,
      type,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      data: data ?? {},
      narrative: narrative ?? null,
      generatedById: session.id,
    },
    include: {
      generatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(report, { status: 201 });
}
