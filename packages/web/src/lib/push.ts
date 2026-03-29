/**
 * Push notification sender for Expo push notifications.
 *
 * The mobile app registers push tokens via the API.
 * When a broadcast is created, we send push notifications
 * to all eligible volunteers' registered devices.
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushMessage {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  priority?: "default" | "normal" | "high";
  channelId?: string;
}

interface PushResult {
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Send push notifications via Expo Push API.
 * Handles batching (max 100 per request).
 */
export async function sendPushNotifications(
  messages: PushMessage[]
): Promise<PushResult> {
  if (messages.length === 0) {
    return { sent: 0, failed: 0, errors: [] };
  }

  const result: PushResult = { sent: 0, failed: 0, errors: [] };
  const batchSize = 100;

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });

      if (!res.ok) {
        const text = await res.text();
        result.failed += batch.length;
        result.errors.push(`Expo API error ${res.status}: ${text}`);
        continue;
      }

      const data = await res.json();
      if (data.data) {
        for (const ticket of data.data) {
          if (ticket.status === "ok") {
            result.sent++;
          } else {
            result.failed++;
            if (ticket.message) result.errors.push(ticket.message);
          }
        }
      }
    } catch (error: any) {
      result.failed += batch.length;
      result.errors.push(error.message);
    }
  }

  console.log(
    `[push] Sent ${result.sent}, failed ${result.failed}${
      result.errors.length > 0 ? `, errors: ${result.errors.join("; ")}` : ""
    }`
  );

  return result;
}

/**
 * Build push messages for a broadcast notification.
 */
export function buildBroadcastPushMessages(
  tokens: string[],
  broadcast: {
    id: string;
    title: string;
    message: string;
    urgency: string;
    targetDate: string;
    targetStartTime: string;
  }
): PushMessage[] {
  const urgencyPrefix =
    broadcast.urgency === "CRITICAL"
      ? "🚨 URGENT: "
      : broadcast.urgency === "HIGH"
      ? "⚠️ "
      : "";

  return tokens.map((token) => ({
    to: token,
    title: `${urgencyPrefix}${broadcast.title}`,
    body: `${broadcast.message.slice(0, 150)}${broadcast.message.length > 150 ? "..." : ""}`,
    data: {
      type: "BROADCAST",
      broadcastId: broadcast.id,
      screen: "BroadcastDetail",
    },
    sound: "default" as const,
    priority: broadcast.urgency === "CRITICAL" ? "high" as const : "default" as const,
    channelId: "broadcasts",
  }));
}
