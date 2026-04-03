import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const now = new Date();

    // Get pledges that are overdue (ended or past their end date and not fulfilled)
    const overduePledges = await prisma.pledge.findMany({
      where: {
        AND: [
          {
            OR: [
              { endDate: { lt: now } },
              { nextReminderDate: { lte: now } },
            ],
          },
          {
            status: { in: ["ACTIVE", "PARTIALLY_FULFILLED", "OVERDUE"] },
          },
        ],
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        campaign: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        payments: true,
      },
      orderBy: { endDate: "asc" },
      take: 100,
    });

    // Update status to OVERDUE if needed
    for (const pledge of overduePledges) {
      if (pledge.status !== "OVERDUE") {
        await prisma.pledge.update({
          where: { id: pledge.id },
          data: { status: "OVERDUE" },
        });
      }
    }

    return NextResponse.json(overduePledges);
  } catch (error) {
    console.error("Overdue pledges fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch overdue pledges" },
      { status: 500 }
    );
  }
}
