import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { runJob } from "@/lib/scheduled-jobs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const params = await props.params;
    const { id } = params;

    // Get the job
    const job = await prisma.scheduledJob.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Scheduled job not found" },
        { status: 404 }
      );
    }

    // Run the job
    const result = await runJob(job.type as any, { config: job.config as any });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error running scheduled job:", error);
    return NextResponse.json(
      { error: "Failed to run scheduled job" },
      { status: 500 }
    );
  }
}
