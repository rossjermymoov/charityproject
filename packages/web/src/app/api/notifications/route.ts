import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiToken, unauthorizedResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiToken(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: auth.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json(
      notifications.map((notif) => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        body: notif.body,
        link: notif.link,
        channel: notif.channel,
        status: notif.status,
        sentAt: notif.sentAt,
        readAt: notif.readAt,
        createdAt: notif.createdAt,
      }))
    );
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
