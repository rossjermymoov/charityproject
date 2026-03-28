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
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        departments: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
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
        availability: true,
      },
    });

    if (!volunteerProfile) {
      return NextResponse.json(
        { error: "Volunteer profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: volunteerProfile.id,
      status: volunteerProfile.status,
      startDate: volunteerProfile.startDate,
      endDate: volunteerProfile.endDate,
      desiredHoursPerWeek: volunteerProfile.desiredHoursPerWeek,
      contact: volunteerProfile.contact,
      departments: volunteerProfile.departments.map((d) => d.department),
      skills: volunteerProfile.skills.map((s) => ({
        ...s.skill,
        proficiency: s.proficiency,
      })),
      availability: volunteerProfile.availability,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyApiToken(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const data = await request.json();

    const volunteerProfile = await prisma.volunteerProfile.findUnique({
      where: { userId: auth.userId },
    });

    if (!volunteerProfile) {
      return NextResponse.json(
        { error: "Volunteer profile not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.volunteerProfile.update({
      where: { id: volunteerProfile.id },
      data: {
        desiredHoursPerWeek: data.desiredHoursPerWeek,
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        departments: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
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
      },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      startDate: updated.startDate,
      endDate: updated.endDate,
      desiredHoursPerWeek: updated.desiredHoursPerWeek,
      contact: updated.contact,
      departments: updated.departments.map((d) => d.department),
      skills: updated.skills.map((s) => ({
        ...s.skill,
        proficiency: s.proficiency,
      })),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
