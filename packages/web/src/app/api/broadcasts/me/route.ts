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

    const broadcasts = await prisma.broadcast.findMany({
      where: {
        expiresAt: {
          gt: new Date(),
        },
        status: "OPEN",
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        skills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        responses: {
          where: {
            volunteerId: volunteerProfile.id,
          },
          select: {
            id: true,
            response: true,
            respondedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      broadcasts.map((broadcast) => ({
        id: broadcast.id,
        title: broadcast.title,
        message: broadcast.message,
        urgency: broadcast.urgency,
        targetDate: broadcast.targetDate,
        targetStartTime: broadcast.targetStartTime,
        targetEndTime: broadcast.targetEndTime,
        status: broadcast.status,
        maxRespondents: broadcast.maxRespondents,
        expiresAt: broadcast.expiresAt,
        department: broadcast.department,
        skills: broadcast.skills.map((s) => s.skill),
        userResponse:
          broadcast.responses.length > 0
            ? broadcast.responses[0].response
            : null,
        responded: broadcast.responses.length > 0,
      }))
    );
  } catch (error) {
    console.error("Get broadcasts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
