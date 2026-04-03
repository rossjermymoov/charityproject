import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET: Retrieve sync logs for an email marketing integration
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const integration = await prisma.emailMarketingSync.findUnique({
    where: { id },
  });

  if (!integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  const [logs, total] = await Promise.all([
    prisma.syncLog.findMany({
      where: { syncId: id },
      orderBy: { startedAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        direction: true,
        recordsProcessed: true,
        recordsCreated: true,
        recordsUpdated: true,
        recordsFailed: true,
        errors: true,
        startedAt: true,
        completedAt: true,
        status: true,
      },
    }),
    prisma.syncLog.count({
      where: { syncId: id },
    }),
  ]);

  return NextResponse.json({
    logs,
    total,
    limit,
    offset,
  });
}
