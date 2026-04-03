import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/memberships/reminder-history?limit=50&offset=0
 * List sent reminders with contact and membership details.
 * Requires authentication.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500);
    const offset = parseInt(searchParams.get("offset") || "0");
    const reminderType = searchParams.get("type");

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (reminderType) {
      where.type = reminderType;
    }

    // Get total count
    const total = await prisma.renewalReminder.count({ where });

    // Get reminders with related data
    const reminders = await prisma.renewalReminder.findMany({
      where,
      include: {
        membership: {
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            membershipType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        sentAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Format response
    const formatted = reminders.map((reminder) => ({
      id: reminder.id,
      membershipId: reminder.membershipId,
      type: reminder.type,
      sentAt: reminder.sentAt.toISOString(),
      createdAt: reminder.createdAt.toISOString(),
      emailId: reminder.emailId,
      contact: {
        id: reminder.membership.contact.id,
        name: `${reminder.membership.contact.firstName} ${reminder.membership.contact.lastName}`,
        email: reminder.membership.contact.email,
      },
      membership: {
        memberNumber: reminder.membership.memberNumber,
        status: reminder.membership.status,
        endDate: reminder.membership.endDate.toISOString(),
        membershipTypeName: reminder.membership.membershipType.name,
      },
    }));

    return NextResponse.json(
      {
        success: true,
        data: formatted,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching reminder history:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch reminder history",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
