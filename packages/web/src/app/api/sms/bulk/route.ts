import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sendBulkSms } from "@/lib/sms";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/sms/bulk
 * Send bulk SMS to multiple recipients
 *
 * Body:
 * - recipients: Array<{ phone: string, contactId?: string }>
 * - body: string (message text)
 * - segmentId?: string (optional, if sending to a segment)
 * - contactIds?: string[] (optional, if sending to specific contacts)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestBody = await req.json();
    const {
      recipients,
      body: messageBody,
      segmentId,
      contactIds,
    } = requestBody;

    // Validate required fields
    if (!messageBody) {
      return NextResponse.json(
        { error: "Message body is required" },
        { status: 400 }
      );
    }

    let recipientList: Array<{ phone: string; contactId?: string }> = [];

    // Option 1: Explicit recipients list
    if (recipients && Array.isArray(recipients)) {
      if (recipients.length === 0) {
        return NextResponse.json(
          { error: "Recipients list cannot be empty" },
          { status: 400 }
        );
      }
      recipientList = recipients;
    }
    // Option 2: Send to specific contacts
    else if (contactIds && Array.isArray(contactIds)) {
      const contacts = await prisma.contact.findMany({
        where: {
          id: { in: contactIds },
          phone: { not: null },
        },
        select: { id: true, phone: true },
      });

      if (contacts.length === 0) {
        return NextResponse.json(
          { error: "No contacts with phone numbers found" },
          { status: 400 }
        );
      }

      recipientList = contacts.map((c) => ({
        phone: c.phone!,
        contactId: c.id,
      }));
    }
    // Option 3: Send to a segment
    else if (segmentId) {
      // Fetch contacts in the segment with phone numbers
      // This assumes segment filtering is implemented elsewhere
      const contacts = await prisma.contact.findMany({
        where: {
          phone: { not: null },
          // Additional segment filtering would go here
          // depending on how segments are implemented
        },
        select: { id: true, phone: true },
      });

      if (contacts.length === 0) {
        return NextResponse.json(
          { error: "No contacts with phone numbers in segment" },
          { status: 400 }
        );
      }

      recipientList = contacts.map((c) => ({
        phone: c.phone!,
        contactId: c.id,
      }));
    } else {
      return NextResponse.json(
        {
          error:
            "Either recipients, contactIds, or segmentId is required",
        },
        { status: 400 }
      );
    }

    // Send bulk SMS
    const result = await sendBulkSms({
      recipients: recipientList,
      body: messageBody,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error sending bulk SMS:", error);
    const message = error instanceof Error ? error.message : "Failed to send bulk SMS";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
