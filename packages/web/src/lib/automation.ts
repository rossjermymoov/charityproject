"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getSystemSettings } from "@/lib/settings";

export interface AutomationContext {
  contactId?: string;
  amount?: number;
  campaignId?: string;
  donationType?: string;
  donationId?: string;
  eventId?: string;
  tagName?: string;
  [key: string]: any;
}

interface AutomationAction {
  type: "SEND_EMAIL" | "ADD_TAG" | "CREATE_TASK" | "SEND_NOTIFICATION";
  templateId?: string;
  tagName?: string;
  assignTo?: string;
  description?: string;
}

/**
 * Execute automations triggered by a specific event.
 * Finds matching rules, evaluates conditions, and executes actions.
 */
export async function executeAutomations(
  trigger: string,
  context: AutomationContext
): Promise<void> {
  try {
    // Find active rules matching this trigger
    const rules = await prisma.automationRule.findMany({
      where: {
        trigger,
        isActive: true,
      },
      include: {
        logs: {
          take: 0, // Don't load logs
        },
      },
    });

    for (const rule of rules) {
      try {
        // Evaluate conditions
        if (!evaluateConditions(rule.conditions as Record<string, any>, context)) {
          // Conditions not met, log as skipped
          await prisma.automationLog.create({
            data: {
              ruleId: rule.id,
              trigger,
              contactId: context.contactId,
              status: "SKIPPED",
              detail: "Conditions not met",
            },
          });
          continue;
        }

        // Execute actions
        const actions = rule.actions as AutomationAction[];
        for (const action of actions) {
          await executeAction(action, context);
        }

        // Update rule stats and log success
        await Promise.all([
          prisma.automationRule.update({
            where: { id: rule.id },
            data: {
              runCount: { increment: 1 },
              lastRunAt: new Date(),
            },
          }),
          prisma.automationLog.create({
            data: {
              ruleId: rule.id,
              trigger,
              contactId: context.contactId,
              status: "SUCCESS",
            },
          }),
        ]);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // Log failure
        await prisma.automationLog.create({
          data: {
            ruleId: rule.id,
            trigger,
            contactId: context.contactId,
            status: "FAILED",
            detail: errorMessage,
          },
        });

        console.error(
          `Automation rule ${rule.id} (${rule.name}) failed:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Error executing automations:", error);
  }
}

/**
 * Evaluate conditions against context.
 * Empty conditions object means "always execute".
 */
function evaluateConditions(
  conditions: Record<string, any>,
  context: AutomationContext
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true;
  }

  // minAmount: amount >= minAmount
  if (
    conditions.minAmount !== undefined &&
    context.amount !== undefined &&
    context.amount < conditions.minAmount
  ) {
    return false;
  }

  // maxAmount: amount <= maxAmount
  if (
    conditions.maxAmount !== undefined &&
    context.amount !== undefined &&
    context.amount > conditions.maxAmount
  ) {
    return false;
  }

  // campaignId: must match
  if (
    conditions.campaignId &&
    context.campaignId &&
    context.campaignId !== conditions.campaignId
  ) {
    return false;
  }

  // donationType: must match
  if (
    conditions.donationType &&
    context.donationType &&
    context.donationType !== conditions.donationType
  ) {
    return false;
  }

  // tagName: contact must have this tag
  if (conditions.tagName && context.contactId) {
    // Note: This would need to be checked asynchronously
    // For now, we'll validate in executeAction
  }

  return true;
}

/**
 * Execute a single action.
 */
async function executeAction(
  action: AutomationAction,
  context: AutomationContext
): Promise<void> {
  switch (action.type) {
    case "SEND_EMAIL":
      if (action.templateId && context.contactId) {
        await sendEmailFromTemplate(action.templateId, context);
      }
      break;

    case "ADD_TAG":
      if (action.tagName && context.contactId) {
        await addTagToContact(context.contactId, action.tagName);
      }
      break;

    case "CREATE_TASK":
      if (action.description && context.contactId) {
        await createTask(context.contactId, action.description, action.assignTo);
      }
      break;

    case "SEND_NOTIFICATION":
      // Future: implement notifications
      break;
  }
}

/**
 * Send email from template, replacing variables with context values.
 */
async function sendEmailFromTemplate(
  templateId: string,
  context: AutomationContext
): Promise<void> {
  const template = await prisma.emailTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error(`Email template ${templateId} not found`);
  }

  if (!context.contactId) {
    throw new Error("No contact ID provided");
  }

  const contact = await prisma.contact.findUnique({
    where: { id: context.contactId },
  });

  if (!contact || !contact.email) {
    throw new Error(`Contact ${context.contactId} not found or has no email`);
  }

  // Get system settings for org name
  const settings = await getSystemSettings();

  // Build variable replacements
  const variables = {
    donorName: `${contact.firstName} ${contact.lastName}`,
    contactFirstName: contact.firstName,
    contactLastName: contact.lastName,
    contactEmail: contact.email,
    amount: context.amount || "N/A",
    donationType: context.donationType || "N/A",
    campaignId: context.campaignId || "N/A",
    date: new Date().toLocaleDateString(),
    orgName: settings?.orgName || "Our Organisation",
    ...context,
  };

  // Replace variables in subject and body
  const subject = replaceVariables(template.subject, variables);
  const bodyHtml = replaceVariables(template.bodyHtml, variables);
  const bodyText = template.bodyText
    ? replaceVariables(template.bodyText, variables)
    : undefined;

  await sendEmail({
    to: contact.email,
    subject,
    html: bodyHtml,
    text: bodyText,
  });
}

/**
 * Replace {{variable}} placeholders in text.
 */
function replaceVariables(
  text: string,
  variables: Record<string, any>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Add a tag to a contact.
 */
async function addTagToContact(contactId: string, tagName: string): Promise<void> {
  // Check if contact exists
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
  });

  if (!contact) {
    throw new Error(`Contact ${contactId} not found`);
  }

  // Find or create tag
  let tag = await prisma.contactTag.findFirst({
    where: {
      tag: {
        name: tagName,
      },
      contactId,
    },
  });

  if (!tag) {
    // Find or create the tag
    let tagRecord = await prisma.tag.findFirst({
      where: { name: tagName },
    });

    if (!tagRecord) {
      tagRecord = await prisma.tag.create({
        data: { name: tagName },
      });
    }

    // Link tag to contact
    await prisma.contactTag.create({
      data: {
        contactId,
        tagId: tagRecord.id,
      },
    });
  }
}

/**
 * Create a task (if tasks table exists).
 * For now, this is a placeholder for future implementation.
 */
async function createTask(
  contactId: string,
  description: string,
  assignTo?: string
): Promise<void> {
  // Placeholder for future task system implementation
  console.log(`Would create task for ${contactId}: ${description}`);
}

/**
 * Get summary statistics about automation rules.
 */
export async function getAutomationStats() {
  const [totalRules, activeRules, recentLogs] = await Promise.all([
    prisma.automationRule.count(),
    prisma.automationRule.count({ where: { isActive: true } }),
    prisma.automationLog.findMany({
      where: {
        executedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: {
        status: true,
      },
    }),
  ]);

  const successCount = recentLogs.filter((log) => log.status === "SUCCESS").length;
  const failureCount = recentLogs.filter((log) => log.status === "FAILED").length;

  return {
    totalRules,
    activeRules,
    successCount,
    failureCount,
  };
}
