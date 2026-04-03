import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sendSms } from "@/lib/sms";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/sms/send
 * Send an SMS to a single contact or phone number
 *
 * Body:
 * - to: string (phone number in E.164 format, e.g., +1234567890)
 * - body: string (message text)
 * - contactId: string (optional, link to contact)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { to, body: messageBody, contactId } = body;

    // Validate required fields
    if (!to || !messageBody) {
      return NextResponse.json(
        { error: "Phone number and message body are required" },
        { status: 400 }
      );
    }

    // If contactId provided, verify it exists
    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
      });
      if (!contact) {
        return NextResponse.json(
          { error: "Contact not found" },
          { status: 404 }
        );
      }
    }

    // Send SMS
    const messageId = await sendSms({
      to,
      body: messageBody,
      contactId,
    });

    return NextResponse.json({ id: messageId, success: true }, { status: 201 });
  } catch (error) {
    console.error("Error sending SMS:", error);
    const message = error instanceof Error ? error.message : "Failed to send SMS";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
