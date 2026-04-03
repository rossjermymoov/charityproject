import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const params = await props.params;
    const { id } = params;
    const body = await req.json();

    const updated = await prisma.scheduledJob.update({
      where: { id },
      data: {
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        schedule: body.schedule !== undefined ? body.schedule : undefined,
        config: body.config !== undefined ? body.config : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating scheduled job:", error);
    return NextResponse.json(
      { error: "Failed to update scheduled job" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const params = await props.params;
    const { id } = params;

    const job = await prisma.scheduledJob.findUnique({
      where: { id },
      include: {
        runs: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Scheduled job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error fetching scheduled job:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled job" },
      { status: 500 }
    );
  }
}
