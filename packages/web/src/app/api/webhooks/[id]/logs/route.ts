import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Check webhook exists
    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    // Get pagination params
    const { searchParams } = new URL(req.url);
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "50");

    const [logs, total] = await Promise.all([
      prisma.webhookLog.findMany({
        where: { webhookId: id },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.webhookLog.count({
        where: { webhookId: id },
      }),
    ]);

    return NextResponse.json({
      logs,
      total,
      skip,
      take,
      hasMore: skip + take < total,
    });
  } catch (error) {
    console.error("Error fetching webhook logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhook logs" },
      { status: 500 }
    );
  }
}
