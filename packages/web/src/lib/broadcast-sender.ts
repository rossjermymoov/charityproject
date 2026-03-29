import { prisma } from "./prisma";
import { sendEmail, buildBroadcastEmailHtml } from "./email";
import { sendPushNotifications, buildBroadcastPushMessages } from "./push";

interface BroadcastWithDetails {
  id: string;
  title: string;
  message: string;
  urgency: string;
  targetDate: string;
  targetStartTime: string;
  targetEndTime: string;
  maxRespondents: number;
  departmentId: string | null;
  createdById: string;
  skills: Array<{ skillId: string }>;
}

interface SendResult {
  emailsSent: number;
  pushSent: number;
  totalRecipients: number;
}

/**
 * Send broadcast notifications to all eligible volunteers via email and push.
 *
 * Eligibility:
 * 1. User has VOLUNTEER role
 * 2. User has an active volunteer profile
 * 3. User has broadcastOptIn enabled (default true)
 * 4. If broadcast requires skills, volunteer must have at least one matching skill
 * 5. If broadcast targets a department, volunteer must belong to that department
 */
export async function sendBroadcastNotifications(
  broadcast: BroadcastWithDetails
): Promise<SendResult> {
  const result: SendResult = { emailsSent: 0, pushSent: 0, totalRecipients: 0 };

  try {
    // Get the broadcast creator name
    const creator = await prisma.user.findUnique({
      where: { id: broadcast.createdById },
      select: { name: true },
    });

    // Get the department name if applicable
    let departmentName: string | undefined;
    if (broadcast.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: broadcast.departmentId },
        select: { name: true },
      });
      departmentName = dept?.name;
    }

    // Get skill names for the email
    const skillNames: string[] = [];
    if (broadcast.skills.length > 0) {
      const skills = await prisma.skill.findMany({
        where: { id: { in: broadcast.skills.map((s) => s.skillId) } },
        select: { name: true },
      });
      skillNames.push(...skills.map((s) => s.name));
    }

    // Find eligible volunteers
    // When skills are specified, match on skills (department is informational).
    // When only a department is specified (no skills), match on department.
    // When neither is specified, broadcast to all active volunteers.
    const volunteers = await prisma.volunteerProfile.findMany({
      where: {
        status: "ACTIVE",
        ...(broadcast.skills.length > 0
          ? {
              // Skill match takes priority — find anyone with the right skills
              skills: {
                some: {
                  skillId: { in: broadcast.skills.map((s) => s.skillId) },
                },
              },
            }
          : broadcast.departmentId
          ? {
              // No skills specified, fall back to department match
              departments: {
                some: { departmentId: broadcast.departmentId },
              },
            }
          : {}),
      },
      include: {
        contact: { select: { email: true, firstName: true, lastName: true } },
        user: {
          select: {
            id: true,
            email: true,
            notificationPreference: true,
            pushDevices: { where: { isActive: true } },
          },
        },
      },
    });

    // Collect email addresses and push tokens for eligible volunteers
    const emailRecipients: string[] = [];
    const pushTokens: string[] = [];

    for (const vol of volunteers) {
      const prefs = vol.user?.notificationPreference;

      // Check broadcast opt-in (default true if no prefs set)
      const isOptedIn = prefs?.broadcastOptIn !== false;
      if (!isOptedIn) continue;

      result.totalRecipients++;

      // Collect email if email is enabled
      if (prefs?.emailEnabled !== false) {
        // Prefer volunteer's contact email, fall back to user email
        const email = vol.contact?.email || vol.user?.email;
        if (email) emailRecipients.push(email);
      }

      // Collect push tokens if push is enabled
      if (prefs?.pushEnabled !== false && vol.user?.pushDevices) {
        for (const device of vol.user.pushDevices) {
          pushTokens.push(device.token);
        }
      }
    }

    // Send emails
    if (emailRecipients.length > 0) {
      const emailHtml = buildBroadcastEmailHtml({
        broadcastId: broadcast.id,
        title: broadcast.title,
        message: broadcast.message,
        urgency: broadcast.urgency,
        targetDate: broadcast.targetDate,
        targetStartTime: broadcast.targetStartTime,
        targetEndTime: broadcast.targetEndTime,
        departmentName,
        createdByName: creator?.name || "Staff",
        maxRespondents: broadcast.maxRespondents,
        skills: skillNames,
      });

      const urgencyPrefix =
        broadcast.urgency === "CRITICAL"
          ? "🚨 URGENT: "
          : broadcast.urgency === "HIGH"
          ? "⚠️ "
          : "";

      const sent = await sendEmail({
        to: emailRecipients,
        subject: `${urgencyPrefix}Volunteer Needed: ${broadcast.title}`,
        html: emailHtml,
      });

      if (sent) result.emailsSent = emailRecipients.length;
    }

    // Send push notifications
    if (pushTokens.length > 0) {
      const pushMessages = buildBroadcastPushMessages(pushTokens, broadcast);
      const pushResult = await sendPushNotifications(pushMessages);
      result.pushSent = pushResult.sent;
    }

    // Create Notification records for in-app tracking
    const notificationData = volunteers
      .filter((v) => v.user)
      .map((vol) => ({
        recipientId: vol.user!.id,
        type: "BROADCAST",
        title: broadcast.title,
        body: broadcast.message.slice(0, 255),
        link: `/broadcasts/${broadcast.id}`,
        channel: "BROADCAST",
        status: "SENT",
        sentAt: new Date(),
      }));

    if (notificationData.length > 0) {
      await prisma.notification.createMany({ data: notificationData });
    }

    console.log(
      `[broadcast-sender] Broadcast "${broadcast.title}" → ${result.totalRecipients} volunteers, ${result.emailsSent} emails, ${result.pushSent} push`
    );
  } catch (error) {
    console.error("[broadcast-sender] Error sending notifications:", error);
  }

  return result;
}
