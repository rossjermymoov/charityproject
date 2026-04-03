import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { sendTestWebhook } from "@/lib/webhooks";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Check webhook exists
    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    const result = await sendTestWebhook(id);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error("Error sending test webhook:", error);
    return NextResponse.json(
      { error: "Failed to send test webhook" },
      { status: 500 }
    );
  }
}
