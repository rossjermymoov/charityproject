import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET: Retrieve sync log history
 * Query params: type (DONATION|CONTACT|INVOICE), status (SUCCESS|FAILED|PENDING|SKIPPED), limit
 */

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "100");

  const where: any = {};
  if (entityType) where.entityType = entityType;
  if (status) where.status = status;

  const logs = await prisma.xeroSyncLog.findMany({
    where,
    orderBy: { syncedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    logs: logs.map((log) => ({
      id: log.id,
      entityType: log.entityType,
      entityId: log.entityId,
      xeroId: log.xeroId,
      direction: log.direction,
      status: log.status,
      detail: log.detail,
      syncedAt: log.syncedAt,
    })),
    count: logs.length,
  });
}
