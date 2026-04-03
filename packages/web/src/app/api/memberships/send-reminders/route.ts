import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sendRenewalReminders } from "@/lib/renewal-reminders";

/**
 * POST /api/memberships/send-reminders
 * Trigger the batch sending of membership renewal reminders.
 * Requires authentication.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run the reminder sending process
    const result = await sendRenewalReminders();

    return NextResponse.json(
      {
        success: true,
        message: `Sent ${result.totalSent} renewal reminders`,
        data: {
          totalSent: result.totalSent,
          remindersBySentTime: result.remindersBySentTime,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending renewal reminders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send renewal reminders",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
