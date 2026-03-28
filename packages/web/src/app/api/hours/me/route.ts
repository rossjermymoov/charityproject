import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiToken, unauthorizedResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiToken(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const volunteerProfile = await prisma.volunteerProfile.findUnique({
      where: { userId: auth.userId },
    });

    if (!volunteerProfile) {
      return NextResponse.json(
        { error: "Volunteer profile not found" },
        { status: 404 }
      );
    }

    const hoursLogs = await prisma.volunteerHoursLog.findMany({
      where: {
        volunteerId: volunteerProfile.id,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(
      hoursLogs.map((log) => ({
        id: log.id,
        date: log.date,
        hours: log.hours,
        description: log.description,
        status: log.status,
        department: log.department,
        createdAt: log.createdAt,
      }))
    );
  } catch (error) {
    console.error("Get hours error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
