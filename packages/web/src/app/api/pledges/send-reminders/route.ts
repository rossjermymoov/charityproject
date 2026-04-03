import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const now = new Date();

    // Get pledges that need reminders
    const pledgesToRemind = await prisma.pledge.findMany({
      where: {
        AND: [
          {
            nextReminderDate: { lte: now },
          },
          {
            reminderFrequency: { not: null },
          },
          {
            status: { in: ["ACTIVE", "PARTIALLY_FULFILLED", "OVERDUE"] },
          },
        ],
      },
      include: {
        contact: true,
        campaign: true,
      },
    });

    let sentCount = 0;
    const errors: any[] = [];

    for (const pledge of pledgesToRemind) {
      try {
        if (!pledge.contact.email) {
          errors.push({
            pledgeId: pledge.id,
            error: "Contact has no email address",
          });
          continue;
        }

        const totalOutstanding = Number(pledge.amount) - Number(pledge.totalFulfilled);

        const emailContent = `
Dear ${pledge.contact.firstName},

We wanted to remind you about your pledge of £${pledge.amount.toFixed(2)} ${
          pledge.currency === "GBP" ? "" : "(" + pledge.currency + ")"
        }.

${
  pledge.campaign
    ? `This pledge is associated with our ${pledge.campaign.name} campaign.`
    : ""
}

Amount Pledged: £${pledge.amount.toFixed(2)}
Amount Fulfilled: £${pledge.totalFulfilled.toFixed(2)}
Outstanding: £${totalOutstanding.toFixed(2)}

${
  pledge.status === "OVERDUE"
    ? "This pledge is now overdue and we would appreciate your support at your earliest convenience."
    : "We would appreciate your support at your earliest convenience."
}

${
  pledge.notes
    ? `Additional Information: ${pledge.notes}`
    : ""
}

Thank you for your continued support.

Best regards,
The Charity Team
`;

        await sendEmail({
          to: pledge.contact.email,
          subject: `Pledge Reminder: Outstanding £${totalOutstanding.toFixed(2)}`,
          text: emailContent,
          html: `<p>${emailContent.replace(/\n/g, "</p><p>")}</p>`,
        });

        // Calculate next reminder date
        let nextReminderDate = new Date(now);
        if (pledge.reminderFrequency === "WEEKLY") {
          nextReminderDate.setDate(nextReminderDate.getDate() + 7);
        } else if (pledge.reminderFrequency === "MONTHLY") {
          nextReminderDate.setMonth(nextReminderDate.getMonth() + 1);
        } else if (pledge.reminderFrequency === "QUARTERLY") {
          nextReminderDate.setMonth(nextReminderDate.getMonth() + 3);
        }

        // Update pledge with next reminder date
        await prisma.pledge.update({
          where: { id: pledge.id },
          data: { nextReminderDate },
        });

        sentCount++;
      } catch (error) {
        console.error(`Failed to send reminder for pledge ${pledge.id}:`, error);
        errors.push({
          pledgeId: pledge.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      totalPledges: pledgesToRemind.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Send reminders error:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}
