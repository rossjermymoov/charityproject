import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const params = await props.params;
    const { id } = params;

    // Get the limit from query params
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20");

    const runs = await prisma.jobRun.findMany({
      where: { jobId: id },
      orderBy: { startedAt: "desc" },
      take: Math.min(limit, 100),
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error("Error fetching job run history:", error);
    return NextResponse.json(
      { error: "Failed to fetch job run history" },
      { status: 500 }
    );
  }
}
