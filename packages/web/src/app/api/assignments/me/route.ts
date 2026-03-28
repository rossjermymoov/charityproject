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

    const assignments = await prisma.assignment.findMany({
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
        date: "asc",
      },
    });

    return NextResponse.json(
      assignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        date: assignment.date,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        status: assignment.status,
        department: assignment.department,
      }))
    );
  } catch (error) {
    console.error("Get assignments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
