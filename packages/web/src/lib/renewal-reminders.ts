import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export type ReminderType =
  | "FIRST_REMINDER"
  | "SECOND_REMINDER"
  | "FINAL_REMINDER"
  | "EXPIRY_NOTICE"
  | "LAPSED_NOTICE";

interface ReminderConfig {
  type: ReminderType;
  daysBeforeEndDate: number | null; // null for "on expiry" and "after lapse"
  daysAfterEndDate: number | null; // for lapsed notice (30 days after)
}

const reminderConfigs: ReminderConfig[] = [
  { type: "FIRST_REMINDER", daysBeforeEndDate: 30, daysAfterEndDate: null },
  { type: "SECOND_REMINDER", daysBeforeEndDate: 14, daysAfterEndDate: null },
  { type: "FINAL_REMINDER", daysBeforeEndDate: 7, daysAfterEndDate: null },
  { type: "EXPIRY_NOTICE", daysBeforeEndDate: 0, daysAfterEndDate: null },
  { type: "LAPSED_NOTICE", daysBeforeEndDate: null, daysAfterEndDate: 30 },
];

function getEmailTemplateHtml(
  memberName: string,
  membershipTypeName: string,
  reminderType: ReminderType,
  endDate: Date,
  renewalUrl: string
): string {
  const colorMap: Record<ReminderType, string> = {
    FIRST_REMINDER: "#3B82F6", // blue
    SECOND_REMINDER: "#F59E0B", // amber
    FINAL_REMINDER: "#EF4444", // red
    EXPIRY_NOTICE: "#DC2626", // dark red
    LAPSED_NOTICE: "#991B1B", // very dark red
  };

  const titleMap: Record<ReminderType, string> = {
    FIRST_REMINDER: "Your Membership Expires Soon",
    SECOND_REMINDER: "Your Membership Expires in 14 Days",
    FINAL_REMINDER: "Your Membership Expires This Week",
    EXPIRY_NOTICE: "Your Membership Has Expired",
    LAPSED_NOTICE: "Your Membership Lapsed",
  };

  const messageMap: Record<ReminderType, string> = {
    FIRST_REMINDER: `Your ${membershipTypeName} membership will expire on ${endDate.toLocaleDateString()}. Please renew your membership to continue enjoying member benefits.`,
    SECOND_REMINDER: `Your ${membershipTypeName} membership will expire in 14 days (${endDate.toLocaleDateString()}). Renew now to avoid any service interruption.`,
    FINAL_REMINDER: `Your ${membershipTypeName} membership expires this week on ${endDate.toLocaleDateString()}. Please renew today to maintain uninterrupted access.`,
    EXPIRY_NOTICE: `Your ${membershipTypeName} membership expired on ${endDate.toLocaleDateString()}. Please renew your membership to regain access to member benefits.`,
    LAPSED_NOTICE: `Your ${membershipTypeName} membership has been inactive since ${endDate.toLocaleDateString()}. We'd love to have you back! Renew your membership today.`,
  };

  const color = colorMap[reminderType];
  const title = titleMap[reminderType];
  const message = messageMap[reminderType];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${color}; padding: 24px 32px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">
                ${title}
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Membership Renewal Notice
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px; color: #111827; font-size: 15px; line-height: 1.6;">
                Hello ${memberName},
              </p>
              <p style="margin: 0 0 24px; color: #374151; font-size: 15px; line-height: 1.6;">
                ${message}
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${renewalUrl}" style="display: inline-block; background-color: ${color}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Renew Membership
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0; color: #6B7280; font-size: 13px; line-height: 1.6;">
                If you have any questions about your membership, please contact us at support@deepcharity.org
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px; text-align: center;">
                You're receiving this email because you're a member of our organization.
                Manage your membership preferences in your account dashboard.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getPlainTextVersion(
  memberName: string,
  membershipTypeName: string,
  reminderType: ReminderType,
  endDate: Date
): string {
  const messageMap: Record<ReminderType, string> = {
    FIRST_REMINDER: `Your ${membershipTypeName} membership will expire on ${endDate.toLocaleDateString()}. Please renew your membership to continue enjoying member benefits.`,
    SECOND_REMINDER: `Your ${membershipTypeName} membership will expire in 14 days (${endDate.toLocaleDateString()}). Renew now to avoid any service interruption.`,
    FINAL_REMINDER: `Your ${membershipTypeName} membership expires this week on ${endDate.toLocaleDateString()}. Please renew today to maintain uninterrupted access.`,
    EXPIRY_NOTICE: `Your ${membershipTypeName} membership expired on ${endDate.toLocaleDateString()}. Please renew your membership to regain access to member benefits.`,
    LAPSED_NOTICE: `Your ${membershipTypeName} membership has been inactive since ${endDate.toLocaleDateString()}. We'd love to have you back! Renew your membership today.`,
  };

  return `
Hello ${memberName},

${messageMap[reminderType]}

Please visit your account dashboard to renew your membership.

---
If you have any questions about your membership, please contact us at support@deepcharity.org
You're receiving this email because you're a member of our organization.
  `.trim();
}

/**
 * Send renewal reminders for all memberships that need them.
 * Checks for:
 * - 30 days before endDate: FIRST_REMINDER
 * - 14 days before: SECOND_REMINDER
 * - 7 days before: FINAL_REMINDER
 * - On expiry: EXPIRY_NOTICE
 * - 30 days after lapse: LAPSED_NOTICE
 *
 * Does not send duplicate reminders (checks RenewalReminder table).
 */
export async function sendRenewalReminders(): Promise<{
  totalSent: number;
  remindersBySentTime: Record<
    ReminderType,
    { count: number; sentAt: Date; membershipIds: string[] }
  >;
}> {
  const now = new Date();
  const sentReminders: Record<
    ReminderType,
    { count: number; sentAt: Date; membershipIds: string[] }
  > = {
    FIRST_REMINDER: { count: 0, sentAt: now, membershipIds: [] },
    SECOND_REMINDER: { count: 0, sentAt: now, membershipIds: [] },
    FINAL_REMINDER: { count: 0, sentAt: now, membershipIds: [] },
    EXPIRY_NOTICE: { count: 0, sentAt: now, membershipIds: [] },
    LAPSED_NOTICE: { count: 0, sentAt: now, membershipIds: [] },
  };

  let totalSent = 0;

  // Process each reminder type
  for (const config of reminderConfigs) {
    try {
      // Get memberships that should receive this reminder type
      let memberships: Array<{
        id: string;
        endDate: Date;
        status: string;
        contact: { id: string; firstName: string; lastName: string; email: string | null };
        membershipType: { name: string };
        renewalReminders: Array<{ type: string }>;
      }>;

      if (config.type === "FIRST_REMINDER" || config.type === "SECOND_REMINDER" || config.type === "FINAL_REMINDER") {
        // These are sent N days before expiry
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + config.daysBeforeEndDate!);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);

        memberships = await prisma.membership.findMany({
          where: {
            status: "ACTIVE",
            endDate: {
              gte: targetDate,
              lt: nextDate,
            },
          },
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            membershipType: {
              select: {
                name: true,
              },
            },
            renewalReminders: {
              select: {
                type: true,
              },
            },
          },
        });
      } else if (config.type === "EXPIRY_NOTICE") {
        // Expires today
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        memberships = await prisma.membership.findMany({
          where: {
            status: "ACTIVE",
            endDate: {
              gte: today,
              lt: tomorrow,
            },
          },
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            membershipType: {
              select: {
                name: true,
              },
            },
            renewalReminders: {
              select: {
                type: true,
              },
            },
          },
        });
      } else if (config.type === "LAPSED_NOTICE") {
        // 30 days after expiry
        const lapsedDate = new Date(now);
        lapsedDate.setDate(lapsedDate.getDate() - 30);
        const nextLapsedDate = new Date(lapsedDate);
        nextLapsedDate.setDate(nextLapsedDate.getDate() + 1);

        memberships = await prisma.membership.findMany({
          where: {
            status: "EXPIRED",
            endDate: {
              gte: lapsedDate,
              lt: nextLapsedDate,
            },
          },
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            membershipType: {
              select: {
                name: true,
              },
            },
            renewalReminders: {
              select: {
                type: true,
              },
            },
          },
        });
      } else {
        memberships = [];
      }

      // Send reminders to memberships that haven't already received this type
      for (const membership of memberships) {
        // Check if reminder was already sent
        const alreadySent = membership.renewalReminders.some(
          (reminder) => reminder.type === config.type
        );

        if (alreadySent) {
          continue;
        }

        // Only send if contact has email
        if (!membership.contact.email) {
          continue;
        }

        const memberName = `${membership.contact.firstName} ${membership.contact.lastName}`;
        const renewalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://web-production-68151.up.railway.app"}/dashboard/finance/memberships/${membership.id}`;

        const html = getEmailTemplateHtml(
          memberName,
          membership.membershipType.name,
          config.type,
          membership.endDate,
          renewalUrl
        );

        const text = getPlainTextVersion(
          memberName,
          membership.membershipType.name,
          config.type,
          membership.endDate
        );

        // Send email
        const emailSent = await sendEmail({
          to: membership.contact.email,
          subject: `Membership Renewal Reminder - ${membership.membershipType.name}`,
          html,
          text,
        });

        if (emailSent) {
          // Record the reminder in database
          const reminder = await prisma.renewalReminder.create({
            data: {
              membershipId: membership.id,
              type: config.type,
              sentAt: now,
              emailId: `email-${membership.id}-${config.type}-${Date.now()}`,
            },
          });

          sentReminders[config.type].count++;
          sentReminders[config.type].membershipIds.push(membership.id);
          totalSent++;

          console.log(
            `Sent ${config.type} reminder to ${membership.contact.email} for membership ${membership.id}`
          );
        } else {
          console.error(
            `Failed to send ${config.type} reminder to ${membership.contact.email} for membership ${membership.id}`
          );
        }
      }
    } catch (error) {
      console.error(`Error processing ${config.type} reminders:`, error);
    }
  }

  return {
    totalSent,
    remindersBySentTime: sentReminders,
  };
}

/**
 * Get statistics about sent reminders
 */
export async function getReminderStats(period: "today" | "week" | "month" = "week"): Promise<{
  totalSent: number;
  byType: Record<ReminderType, number>;
  byDate: Array<{ date: string; count: number }>;
}> {
  const now = new Date();
  let startDate = new Date(now);

  if (period === "today") {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    const day = startDate.getDay();
    const diff = startDate.getDate() - day;
    startDate.setDate(diff);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  }

  const reminders = await prisma.renewalReminder.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: now,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const byType: Record<ReminderType, number> = {
    FIRST_REMINDER: 0,
    SECOND_REMINDER: 0,
    FINAL_REMINDER: 0,
    EXPIRY_NOTICE: 0,
    LAPSED_NOTICE: 0,
  };

  const byDateMap = new Map<string, number>();

  for (const reminder of reminders) {
    byType[reminder.type as ReminderType]++;

    const dateKey = reminder.createdAt.toISOString().split("T")[0];
    byDateMap.set(dateKey, (byDateMap.get(dateKey) || 0) + 1);
  }

  const byDate = Array.from(byDateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalSent: reminders.length,
    byType,
    byDate,
  };
}
