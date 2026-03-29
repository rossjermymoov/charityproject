import { sendEmailViaProvider } from "./email-providers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://web-production-68151.up.railway.app";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email via the configured provider (database) or SENDGRID_API_KEY env var fallback.
 * Returns true if sent successfully, false otherwise.
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  return sendEmailViaProvider(options);
}

// ============================================
// EMAIL TEMPLATES
// ============================================

const urgencyColors: Record<string, string> = {
  LOW: "#6B7280",
  NORMAL: "#3B82F6",
  HIGH: "#F59E0B",
  CRITICAL: "#EF4444",
};

const urgencyLabels: Record<string, string> = {
  LOW: "Low Priority",
  NORMAL: "Normal",
  HIGH: "High Priority",
  CRITICAL: "Urgent",
};

interface BroadcastEmailData {
  broadcastId: string;
  title: string;
  message: string;
  urgency: string;
  targetDate: string;
  targetStartTime: string;
  targetEndTime: string;
  departmentName?: string;
  createdByName: string;
  maxRespondents: number;
  skills?: string[];
}

export function buildBroadcastEmailHtml(data: BroadcastEmailData): string {
  const color = urgencyColors[data.urgency] || urgencyColors.NORMAL;
  const urgencyLabel = urgencyLabels[data.urgency] || data.urgency;
  const respondUrl = `${APP_URL}/broadcasts/${data.broadcastId}/respond`;

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
                ${data.urgency === "CRITICAL" ? "🚨 " : ""}Volunteer Needed${data.urgency === "CRITICAL" ? " — URGENT" : ""}
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                ${urgencyLabel} • ${data.maxRespondents} volunteer${data.maxRespondents > 1 ? "s" : ""} needed
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #111827; font-size: 18px; font-weight: 600;">
                ${data.title}
              </h2>
              <p style="margin: 0 0 24px; color: #374151; font-size: 15px; line-height: 1.6;">
                ${data.message.replace(/\n/g, "<br>")}
              </p>

              <!-- Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 16px;">
                    <p style="margin: 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">When</p>
                    <p style="margin: 4px 0 0; color: #111827; font-size: 15px; font-weight: 500;">
                      ${data.targetDate} • ${data.targetStartTime} – ${data.targetEndTime}
                    </p>
                  </td>
                </tr>
                ${data.departmentName ? `
                <tr>
                  <td style="padding: 8px 16px;">
                    <p style="margin: 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Department</p>
                    <p style="margin: 4px 0 0; color: #111827; font-size: 15px; font-weight: 500;">${data.departmentName}</p>
                  </td>
                </tr>
                ` : ""}
                ${data.skills && data.skills.length > 0 ? `
                <tr>
                  <td style="padding: 8px 16px;">
                    <p style="margin: 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Skills Needed</p>
                    <p style="margin: 4px 0 0; color: #111827; font-size: 15px; font-weight: 500;">${data.skills.join(", ")}</p>
                  </td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding: 8px 16px;">
                    <p style="margin: 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Posted by</p>
                    <p style="margin: 4px 0 0; color: #111827; font-size: 15px; font-weight: 500;">${data.createdByName}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${respondUrl}" style="display: inline-block; background-color: ${color}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Respond to Broadcast
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px; text-align: center;">
                You're receiving this because you're registered as a volunteer.
                Log in to manage your notification preferences.
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

export { APP_URL };
