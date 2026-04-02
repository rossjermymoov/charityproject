import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const ruleId = searchParams.get("ruleId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, any> = {};
    if (ruleId) where.ruleId = ruleId;
    if (status) where.status = status;

    const [logs, total] = await Promise.all([
      prisma.automationLog.findMany({
        where,
        orderBy: { executedAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          rule: {
            select: {
              id: true,
              name: true,
              trigger: true,
            },
          },
        },
      }),
      prisma.automationLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching automation logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch automation logs" },
      { status: 500 }
    );
  }
}
