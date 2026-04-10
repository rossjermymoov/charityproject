import crypto from "crypto";
import { prisma } from "./prisma";

export type WebhookEvent =
  | "CONTACT_CREATED"
  | "CONTACT_UPDATED"
  | "DONATION_CREATED"
  | "MEMBERSHIP_CREATED"
  | "MEMBERSHIP_RENEWED"
  | "EVENT_REGISTERED";

/**
 * Create HMAC-SHA256 signature for webhook payload
 */
export function createWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verify webhook signature (for receiving webhooks)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = createWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: number;
  data: Record<string, unknown>;
}

/**
 * Trigger outgoing webhooks for an event
 */
export async function triggerWebhooks(
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  // Find active webhooks that are subscribed to this event
  const webhooks = await prisma.webhook.findMany({
    where: {
      isActive: true,
    },
  });

  // Filter webhooks that are subscribed to this event
  const filteredWebhooks = webhooks.filter((w) => {
    const events = Array.isArray(w.events) ? w.events : [];
    return events.includes(event);
  });

  if (filteredWebhooks.length === 0) {
    return; // No webhooks to trigger
  }

  const payload: WebhookPayload = {
    event,
    timestamp: Date.now(),
    data,
  };

  const payloadString = JSON.stringify(payload);

  // Send to each webhook in parallel
  const promises = filteredWebhooks.map((webhook) =>
    sendWebhookRequest(webhook, payloadString, payload)
  );

  await Promise.allSettled(promises);
}

/**
 * Send webhook request to a single endpoint
 */
async function sendWebhookRequest(
  webhook: {
    id: string;
    url: string;
    secret: string | null;
    failCount: number;
  },
  payloadString: string,
  payload: WebhookPayload
): Promise<void> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "ParityCRM/1.0",
    };

    // Add signature header if secret is configured
    if (webhook.secret) {
      const signature = createWebhookSignature(payloadString, webhook.secret);
      headers["X-Webhook-Signature"] = signature;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    const success = response.ok;

    // Log the webhook delivery
    await prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        event: payload.event,
        payload: JSON.parse(JSON.stringify(payload)),
        statusCode: response.status,
        response: responseText.substring(0, 500), // Limit response size
        success,
      },
    });

    // Update webhook metadata
    if (success) {
      // Reset fail count on success
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          lastTriggeredAt: new Date(),
          failCount: 0,
        },
      });
    } else {
      // Increment fail count on failure
      const newFailCount = webhook.failCount + 1;
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          failCount: newFailCount,
          // Disable webhook after 5 consecutive failures
          isActive: newFailCount < 5,
        },
      });
    }
  } catch (error) {
    // Log as failed delivery
    await prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        event: payload.event,
        payload: JSON.parse(JSON.stringify(payload)),
        statusCode: null,
        response: `Error: ${error instanceof Error ? error.message : String(error)}`,
        success: false,
      },
    });

    // Increment fail count
    const newFailCount = webhook.failCount + 1;
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        failCount: newFailCount,
        // Disable webhook after 5 consecutive failures
        isActive: newFailCount < 5,
      },
    });
  }
}

/**
 * Send test webhook
 */
export async function sendTestWebhook(webhookId: string): Promise<{
  success: boolean;
  statusCode?: number;
  message: string;
}> {
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook) {
    return { success: false, message: "Webhook not found" };
  }

  const payload: WebhookPayload = {
    event: "CONTACT_CREATED",
    timestamp: Date.now(),
    data: {
      id: "test-contact-123",
      firstName: "Test",
      lastName: "Contact",
      email: "test@example.com",
      message: "This is a test webhook payload",
    },
  };

  const payloadString = JSON.stringify(payload);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "ParityCRM/1.0",
      "X-Webhook-Test": "true",
    };

    if (webhook.secret) {
      const signature = createWebhookSignature(payloadString, webhook.secret);
      headers["X-Webhook-Signature"] = signature;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();

    // Log the test delivery
    await prisma.webhookLog.create({
      data: {
        webhookId,
        event: "CONTACT_CREATED",
        payload: JSON.parse(JSON.stringify(payload)),
        statusCode: response.status,
        response: responseText.substring(0, 500),
        success: response.ok,
      },
    });

    return {
      success: response.ok,
      statusCode: response.status,
      message: response.ok ? "Test webhook sent successfully" : "Webhook returned error",
    };
  } catch (error) {
    return {
      success: false,
      message: `Error sending test webhook: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
