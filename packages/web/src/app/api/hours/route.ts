import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiToken, unauthorizedResponse } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiToken(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { date, hours, department, description } = await request.json();

    if (!date || !hours || typeof hours !== "number" || hours <= 0) {
      return NextResponse.json(
        { error: "Date and valid hours are required" },
        { status: 400 }
      );
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

    // If department is provided, verify it exists
    let departmentId: string | null = null;
    if (department) {
      const dept = await prisma.department.findUnique({
        where: { name: department },
      });
      if (dept) {
        departmentId = dept.id;
      }
    }

    const hoursLog = await prisma.volunteerHoursLog.create({
      data: {
        volunteerId: volunteerProfile.id,
        departmentId,
        date,
        hours,
        description,
        status: "LOGGED",
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: hoursLog.id,
        date: hoursLog.date,
        hours: hoursLog.hours,
        description: hoursLog.description,
        status: hoursLog.status,
        department: hoursLog.department,
        createdAt: hoursLog.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Log hours error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
