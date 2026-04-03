import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/sms/messages
 * List SMS messages with optional filtering
 *
 * Query params:
 * - contactId?: string (filter by contact)
 * - status?: string (filter by status: QUEUED, SENT, DELIVERED, FAILED)
 * - direction?: string (filter by direction: INBOUND, OUTBOUND)
 * - limit?: number (default 100, max 500)
 * - offset?: number (default 0)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const contactId = url.searchParams.get("contactId");
    const status = url.searchParams.get("status");
    const direction = url.searchParams.get("direction");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "100"),
      500
    );
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Build filter
    const where: Record<string, unknown> = {};
    if (contactId) where.contactId = contactId;
    if (status) where.status = status;
    if (direction) where.direction = direction;

    // Fetch messages
    const [messages, total] = await Promise.all([
      prisma.smsMessage.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.smsMessage.count({ where }),
    ]);

    return NextResponse.json({
      messages,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching SMS messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS messages" },
      { status: 500 }
    );
  }
}
