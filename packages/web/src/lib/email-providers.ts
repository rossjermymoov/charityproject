import { prisma } from "./prisma";
import sgMail from "@sendgrid/mail";

/**
 * Email provider abstraction layer.
 *
 * Loads the default (or specified) provider from the database and dispatches
 * through SendGrid, Amazon SES, or Mailgun accordingly.
 *
 * Falls back to the SENDGRID_API_KEY env var if no provider is configured
 * in the database (backwards compatibility).
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface TestResult {
  success: boolean;
  error?: string;
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Send an email using the default configured provider.
 * Returns true on success, false on failure.
 */
export async function sendEmailViaProvider(options: EmailOptions): Promise<boolean> {
  const provider = await prisma.emailProvider.findFirst({
    where: { isDefault: true, isActive: true },
  });

  if (!provider) {
    // Fall back to env-based SendGrid for backwards compatibility
    return sendViaSendGridEnv(options);
  }

  return sendViaProvider(provider, options);
}

/**
 * Test a provider by sending a test email to the from address.
 */
export async function testEmailProvider(
  provider: {
    id: string;
    provider: string;
    apiKey: string | null;
    accessKeyId: string | null;
    secretAccessKey: string | null;
    region: string | null;
    domain: string | null;
    fromEmail: string;
    fromName: string;
  }
): Promise<TestResult> {
  try {
    const success = await sendViaProvider(provider, {
      to: provider.fromEmail,
      subject: "CharityOS — Email Provider Test",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #111827;">Email Test Successful</h2>
          <p style="color: #374151;">
            This confirms your <strong>${provider.provider}</strong> email provider is working correctly in CharityOS.
          </p>
          <p style="color: #6B7280; font-size: 14px;">
            Sent at ${new Date().toISOString()}
          </p>
        </div>
      `,
    });

    return success
      ? { success: true }
      : { success: false, error: "Send returned false — check provider logs" };
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error" };
  }
}

// ============================================
// PROVIDER DISPATCHERS
// ============================================

async function sendViaProvider(
  provider: {
    provider: string;
    apiKey: string | null;
    accessKeyId: string | null;
    secretAccessKey: string | null;
    region: string | null;
    domain: string | null;
    fromEmail: string;
    fromName: string;
  },
  options: EmailOptions
): Promise<boolean> {
  switch (provider.provider) {
    case "SENDGRID":
      return sendViaSendGrid(provider, options);
    case "SES":
      return sendViaSES(provider, options);
    case "MAILGUN":
      return sendViaMailgun(provider, options);
    case "MAILCHIMP":
      return sendViaMailchimp(provider, options);
    default:
      console.error(`[email-providers] Unknown provider: ${provider.provider}`);
      return false;
  }
}

// ============================================
// SENDGRID
// ============================================

async function sendViaSendGrid(
  provider: { apiKey: string | null; fromEmail: string; fromName: string },
  options: EmailOptions
): Promise<boolean> {
  if (!provider.apiKey) {
    console.error("[email-providers] SendGrid: missing API key");
    return false;
  }

  try {
    sgMail.setApiKey(provider.apiKey);
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    const batchSize = 1000;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      await sgMail.sendMultiple({
        to: batch,
        from: { email: provider.fromEmail, name: provider.fromName },
        subject: options.subject,
        html: options.html,
        text: options.text || stripHtml(options.html),
      });
    }

    console.log(`[email-providers] SendGrid: sent to ${recipients.length} recipient(s)`);
    return true;
  } catch (error: any) {
    console.error("[email-providers] SendGrid error:", error?.response?.body || error.message);
    return false;
  }
}

/**
 * Fallback: send via SENDGRID_API_KEY env var (original behaviour).
 */
async function sendViaSendGridEnv(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn("[email-providers] No email provider configured and no SENDGRID_API_KEY env var");
    return false;
  }

  return sendViaSendGrid(
    {
      apiKey,
      fromEmail: process.env.EMAIL_FROM || "noreply@charity.org",
      fromName: process.env.EMAIL_FROM_NAME || "CharityOS",
    },
    options
  );
}

// ============================================
// AMAZON SES
// ============================================

async function sendViaSES(
  provider: {
    accessKeyId: string | null;
    secretAccessKey: string | null;
    region: string | null;
    fromEmail: string;
    fromName: string;
  },
  options: EmailOptions
): Promise<boolean> {
  if (!provider.accessKeyId || !provider.secretAccessKey) {
    console.error("[email-providers] SES: missing AWS credentials");
    return false;
  }

  try {
    // Dynamic import to avoid requiring the package if not used
    const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");

    const client = new SESClient({
      region: provider.region || "eu-west-1",
      credentials: {
        accessKeyId: provider.accessKeyId,
        secretAccessKey: provider.secretAccessKey,
      },
    });

    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    // SES supports up to 50 recipients per call
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const command = new SendEmailCommand({
        Source: `${provider.fromName} <${provider.fromEmail}>`,
        Destination: { ToAddresses: batch },
        Message: {
          Subject: { Data: options.subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: options.html, Charset: "UTF-8" },
            ...(options.text ? { Text: { Data: options.text, Charset: "UTF-8" } } : {}),
          },
        },
      });

      await client.send(command);
    }

    console.log(`[email-providers] SES: sent to ${recipients.length} recipient(s)`);
    return true;
  } catch (error: any) {
    console.error("[email-providers] SES error:", error.message);
    return false;
  }
}

// ============================================
// MAILGUN
// ============================================

async function sendViaMailgun(
  provider: {
    apiKey: string | null;
    domain: string | null;
    region: string | null;
    fromEmail: string;
    fromName: string;
  },
  options: EmailOptions
): Promise<boolean> {
  if (!provider.apiKey || !provider.domain) {
    console.error("[email-providers] Mailgun: missing API key or domain");
    return false;
  }

  try {
    const baseUrl = provider.region === "EU"
      ? "https://api.eu.mailgun.net"
      : "https://api.mailgun.net";

    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const toStr = recipients.join(", ");

    const formData = new URLSearchParams();
    formData.append("from", `${provider.fromName} <${provider.fromEmail}>`);
    formData.append("to", toStr);
    formData.append("subject", options.subject);
    formData.append("html", options.html);
    if (options.text) formData.append("text", options.text);

    const res = await fetch(
      `${baseUrl}/v3/${provider.domain}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${provider.apiKey}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`[email-providers] Mailgun error ${res.status}:`, text);
      return false;
    }

    console.log(`[email-providers] Mailgun: sent to ${recipients.length} recipient(s)`);
    return true;
  } catch (error: any) {
    console.error("[email-providers] Mailgun error:", error.message);
    return false;
  }
}

// ============================================
// MAILCHIMP (MANDRILL TRANSACTIONAL)
// ============================================

async function sendViaMailchimp(
  provider: {
    apiKey: string | null;
    fromEmail: string;
    fromName: string;
  },
  options: EmailOptions
): Promise<boolean> {
  if (!provider.apiKey) {
    console.error("[email-providers] Mailchimp/Mandrill: missing API key");
    return false;
  }

  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    const message = {
      html: options.html,
      text: options.text || stripHtml(options.html),
      subject: options.subject,
      from_email: provider.fromEmail,
      from_name: provider.fromName,
      to: recipients.map((email) => ({ email, type: "to" as const })),
    };

    const res = await fetch("https://mandrillapp.com/api/1.0/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: provider.apiKey,
        message,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[email-providers] Mailchimp/Mandrill error ${res.status}:`, text);
      return false;
    }

    const results = await res.json();
    const failed = results.filter((r: any) => r.status === "rejected" || r.status === "invalid");
    if (failed.length > 0) {
      console.warn(`[email-providers] Mailchimp/Mandrill: ${failed.length} recipient(s) rejected`);
    }

    console.log(`[email-providers] Mailchimp/Mandrill: sent to ${recipients.length} recipient(s)`);
    return true;
  } catch (error: any) {
    console.error("[email-providers] Mailchimp/Mandrill error:", error.message);
    return false;
  }
}

// ============================================
// UTILS
// ============================================

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
