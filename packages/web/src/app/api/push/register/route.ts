import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/push/register
 * Body: { token: string, platform?: string, deviceName?: string }
 * Header: Authorization: Bearer <userId> (simple token auth for mobile)
 *
 * Registers or updates a push notification token for the mobile app.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const userId = authHeader?.replace("Bearer ", "");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { token, platform, deviceName } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Upsert the device token — if the token already exists, update it
    const device = await prisma.pushDevice.upsert({
      where: { token },
      update: {
        userId,
        platform: platform || "EXPO",
        deviceName: deviceName || null,
        isActive: true,
      },
      create: {
        userId,
        token,
        platform: platform || "EXPO",
        deviceName: deviceName || null,
      },
    });

    return NextResponse.json({ success: true, deviceId: device.id });
  } catch (error) {
    console.error("[push/register] Error:", error);
    return NextResponse.json(
      { error: "Failed to register device" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/register
 * Body: { token: string }
 *
 * Unregisters a push token (e.g. on logout).
 */
export async function DELETE(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (token) {
      await prisma.pushDevice.updateMany({
        where: { token },
        data: { isActive: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[push/register] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to unregister device" },
      { status: 500 }
    );
  }
}
