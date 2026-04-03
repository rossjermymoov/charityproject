import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const jobs = await prisma.scheduledJob.findMany({
      include: {
        runs: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const response = jobs.map((job) => ({
      id: job.id,
      name: job.name,
      type: job.type,
      description: job.description,
      schedule: job.schedule,
      isActive: job.isActive,
      lastRunAt: job.lastRunAt,
      lastRunStatus: job.lastRunStatus,
      lastRunDuration: job.lastRunDuration,
      nextRunAt: job.nextRunAt,
      config: job.config,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      lastRun: job.runs[0] || null,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching scheduled jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled jobs" },
      { status: 500 }
    );
  }
}
