import { prisma } from "./prisma";

// ============================================
// SMS LIBRARY — Twilio integration with mock/demo mode
// ============================================

interface SendSmsOptions {
  to: string;
  body: string;
  contactId?: string;
}

interface BulkSmsOptions {
  recipients: Array<{ phone: string; contactId?: string }>;
  body: string;
}

/**
 * Send a single SMS message via Twilio or mock mode
 * In mock mode (no credentials), logs to console and marks as SENT
 * @returns Promise<SmsMessage ID>
 */
export async function sendSms(options: SendSmsOptions): Promise<string> {
  const { to, body, contactId } = options;

  // Validate phone number format (basic E.164 check)
  if (!isValidPhoneNumber(to)) {
    throw new Error(`Invalid phone number: ${to}`);
  }

  // Get Twilio credentials from environment or system settings
  const { accountSid, authToken, fromPhone } = await getTwilioConfig();

  // Create SMS message record in database
  const smsMessage = await prisma.smsMessage.create({
    data: {
      contactId,
      to,
      from: fromPhone,
      body,
      status: "QUEUED",
      direction: "OUTBOUND",
    },
  });

  // If no credentials, use demo/mock mode
  if (!accountSid || !authToken || !fromPhone) {
    console.log("[SMS MOCK MODE] Would send SMS:", {
      id: smsMessage.id,
      to,
      from: fromPhone,
      body,
    });

    // Update status to SENT in demo mode
    await prisma.smsMessage.update({
      where: { id: smsMessage.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        externalId: `MOCK-${Date.now()}`,
      },
    });

    return smsMessage.id;
  }

  // Send via Twilio
  try {
    const externalId = await sendViaTwilio({
      accountSid,
      authToken,
      from: fromPhone,
      to,
      body,
    });

    // Update message with external ID
    await prisma.smsMessage.update({
      where: { id: smsMessage.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        externalId,
      },
    });

    return smsMessage.id;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update message with error
    await prisma.smsMessage.update({
      where: { id: smsMessage.id },
      data: {
        status: "FAILED",
        errorMessage,
      },
    });

    throw error;
  }
}

/**
 * Send bulk SMS to multiple recipients
 * @returns Promise<{ successCount, failureCount, messageIds }>
 */
export async function sendBulkSms(options: BulkSmsOptions): Promise<{
  successCount: number;
  failureCount: number;
  messageIds: string[];
  errors: Array<{ phone: string; error: string }>;
}> {
  const { recipients, body } = options;

  const results = {
    successCount: 0,
    failureCount: 0,
    messageIds: [] as string[],
    errors: [] as Array<{ phone: string; error: string }>,
  };

  // Process each recipient sequentially (Twilio rate limiting)
  for (const recipient of recipients) {
    try {
      const messageId = await sendSms({
        to: recipient.phone,
        body,
        contactId: recipient.contactId,
      });

      results.successCount++;
      results.messageIds.push(messageId);
    } catch (error) {
      results.failureCount++;
      results.errors.push({
        phone: recipient.phone,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface TwilioConfig {
  accountSid: string | null;
  authToken: string | null;
  fromPhone: string | null;
}

/**
 * Get Twilio credentials from environment or system settings
 */
async function getTwilioConfig(): Promise<TwilioConfig> {
  // Try environment variables first
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    return {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromPhone: process.env.TWILIO_PHONE_NUMBER,
    };
  }

  // Try system settings
  try {
    const settings = await prisma.systemSettings.findFirst();

    // In future, we can add twilioAccountSid, twilioAuthToken, twilioPhoneNumber to SystemSettings
    // For now, this is a placeholder for extensibility
    if (settings) {
      // When system settings are extended with Twilio fields:
      // return {
      //   accountSid: settings.twilioAccountSid || null,
      //   authToken: settings.twilioAuthToken || null,
      //   fromPhone: settings.twilioPhoneNumber || null,
      // };
    }
  } catch (error) {
    console.error("Error fetching Twilio config from settings:", error);
  }

  // Return null credentials (will trigger mock mode)
  return {
    accountSid: null,
    authToken: null,
    fromPhone: null,
  };
}

/**
 * Send SMS via Twilio API
 * @returns Message SID from Twilio
 */
async function sendViaTwilio({
  accountSid,
  authToken,
  from,
  to,
  body,
}: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  body: string;
}): Promise<string> {
  // Build Twilio API URL
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  // Create form data for Twilio API
  const formData = new URLSearchParams();
  formData.append("From", from);
  formData.append("To", to);
  formData.append("Body", body);

  // Make HTTP request to Twilio
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Twilio API error: ${error.message || response.statusText}`);
  }

  const data = (await response.json()) as { sid: string };
  return data.sid;
}

/**
 * Validate phone number format (basic E.164)
 * E.164: +<country code><number>, e.g., +12025551234
 */
function isValidPhoneNumber(phone: string): boolean {
  const e164Regex = /^\+?[1-9]\d{1,14}$/;
  return e164Regex.test(phone.replace(/\s/g, ""));
}

/**
 * Replace variables in SMS template
 * @param template Body template with {{variable}} placeholders
 * @param variables Object with variable values
 * @returns Rendered body text
 */
export function renderSmsTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let body = template;

  for (const [key, value] of Object.entries(variables)) {
    body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  return body;
}

/**
 * Get SMS messages for a contact
 */
export async function getContactSmsMessages(
  contactId: string,
  limit: number = 50
) {
  return prisma.smsMessage.findMany({
    where: { contactId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get all SMS messages (for dashboard/reporting)
 */
export async function getAllSmsMessages(limit: number = 100, offset: number = 0) {
  return prisma.smsMessage.findMany({
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
    include: {
      contact: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });
}

/**
 * Get SMS template by ID
 */
export async function getSmsTemplate(id: string) {
  return prisma.smsTemplate.findUnique({
    where: { id },
  });
}

/**
 * Get all active SMS templates
 */
export async function getActiveSmsTemplates() {
  return prisma.smsTemplate.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Create SMS template
 */
export async function createSmsTemplate({
  name,
  body,
  variables,
}: {
  name: string;
  body: string;
  variables?: string[];
}) {
  return prisma.smsTemplate.create({
    data: {
      name,
      body,
      variables: variables || [],
    },
  });
}

/**
 * Update SMS template
 */
export async function updateSmsTemplate(
  id: string,
  data: {
    name?: string;
    body?: string;
    variables?: string[];
    isActive?: boolean;
  }
) {
  return prisma.smsTemplate.update({
    where: { id },
    data,
  });
}

/**
 * Delete SMS template
 */
export async function deleteSmsTemplate(id: string) {
  return prisma.smsTemplate.delete({
    where: { id },
  });
}
