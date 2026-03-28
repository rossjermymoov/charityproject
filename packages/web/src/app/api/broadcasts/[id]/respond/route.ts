import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiToken, unauthorizedResponse } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyApiToken(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { response, message } = await request.json();

    if (!response || !["ACCEPTED", "TENTATIVE", "DECLINED"].includes(response)) {
      return NextResponse.json(
        { error: "Valid response is required (ACCEPTED, TENTATIVE, or DECLINED)" },
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

    const broadcast = await prisma.broadcast.findUnique({
      where: { id: id },
    });

    if (!broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 }
      );
    }

    if (broadcast.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Broadcast has expired" },
        { status: 400 }
      );
    }

    // Check if volunteer has already responded
    const existingResponse = await prisma.broadcastResponse.findFirst({
      where: {
        broadcastId: id,
        volunteerId: volunteerProfile.id,
      },
    });

    let broadcastResponse;
    if (existingResponse) {
      // Update existing response
      broadcastResponse = await prisma.broadcastResponse.update({
        where: { id: existingResponse.id },
        data: {
          response,
          message,
          respondedAt: new Date(),
        },
      });
    } else {
      // Create new response
      broadcastResponse = await prisma.broadcastResponse.create({
        data: {
          broadcastId: id,
          volunteerId: volunteerProfile.id,
          response,
          message,
        },
      });
    }

    return NextResponse.json({
      id: broadcastResponse.id,
      broadcastId: broadcastResponse.broadcastId,
      response: broadcastResponse.response,
      message: broadcastResponse.message,
      respondedAt: broadcastResponse.respondedAt,
    });
  } catch (error) {
    console.error("Respond to broadcast error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
