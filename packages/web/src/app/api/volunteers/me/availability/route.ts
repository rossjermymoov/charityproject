import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiToken, unauthorizedResponse } from "@/lib/api-auth";

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

    // Delete existing availability records
    await prisma.availability.deleteMany({
      where: {
        volunteerId: volunteerProfile.id,
      },
    });

    // Create new availability records
    if (Array.isArray(data.availability) && data.availability.length > 0) {
      await prisma.availability.createMany({
        data: data.availability.map((avail: any) => ({
          volunteerId: volunteerProfile.id,
          dayOfWeek: avail.dayOfWeek,
          startTime: avail.startTime,
          endTime: avail.endTime,
          isRecurring: avail.isRecurring ?? true,
          specificDate: avail.specificDate,
          notes: avail.notes,
        })),
      });
    }

    const availability = await prisma.availability.findMany({
      where: {
        volunteerId: volunteerProfile.id,
      },
    });

    return NextResponse.json({
      volunteerId: volunteerProfile.id,
      availability,
    });
  } catch (error) {
    console.error("Update availability error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const availability = await prisma.availability.findMany({
      where: {
        volunteerId: volunteerProfile.id,
      },
    });

    return NextResponse.json({
      volunteerId: volunteerProfile.id,
      availability,
    });
  } catch (error) {
    console.error("Get availability error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
