import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { MailchimpClient, MailchimpDemoClient } from "@/lib/integrations/mailchimp";
import { DotdigitalClient, DotdigitalDemoClient } from "@/lib/integrations/dotdigital";

/**
 * POST: Trigger a manual sync for an email marketing integration
 */

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { direction } = body; // PUSH | PULL

  const integration = await prisma.emailMarketingSync.findUnique({
    where: { id },
  });

  if (!integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  if (!["PUSH", "PULL"].includes(direction)) {
    return NextResponse.json({ error: "direction must be PUSH or PULL" }, { status: 400 });
  }

  // Create sync log entry
  const syncLog = await prisma.syncLog.create({
    data: {
      syncId: id,
      direction,
      status: "RUNNING",
    },
  });

  try {
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;
    const errors: Array<{ email?: string; message: string }> = [];

    if (integration.provider === "MAILCHIMP") {
      if (!integration.apiKey) {
        throw new Error("Mailchimp API key not configured");
      }

      const settings = integration.settings as Record<string, any>;
      const listId = settings.listId;

      if (!listId && direction === "PULL") {
        throw new Error("List ID not configured");
      }

      // Use demo mode if no real API key
      const isDemoMode = integration.apiKey === "demo";
      const client = isDemoMode
        ? new MailchimpDemoClient()
        : new MailchimpClient(integration.apiKey, listId);

      if (direction === "PULL") {
        // Sync from Mailchimp to DeepCharity
        const membersResponse = await client.getMembers();
        if (membersResponse?.members) {
          for (const member of membersResponse.members) {
            recordsProcessed++;

            // Find or create contact in DeepCharity
            try {
              const existingContact = await prisma.contact.findFirst({
                where: { email: member.email_address },
              });

              const firstName = (member.merge_fields?.FNAME as string | undefined) || "Unknown";
              const lastName = (member.merge_fields?.LNAME as string | undefined) || "Unknown";

              if (existingContact) {
                recordsUpdated++;
                // Update contact if needed
                await prisma.contact.update({
                  where: { id: existingContact.id },
                  data: {
                    firstName,
                    lastName,
                  },
                });
              } else {
                recordsCreated++;
                // Create new contact
                await prisma.contact.create({
                  data: {
                    firstName,
                    lastName,
                    email: member.email_address,
                    types: ["DONOR"],
                  } as any,
                });
              }
            } catch (error) {
              recordsFailed++;
              errors.push({
                email: member.email_address,
                message: String(error),
              });
            }
          }
        }
      }
    } else if (integration.provider === "DOTDIGITAL") {
      if (!integration.apiKey) {
        throw new Error("Dotdigital API key not configured");
      }

      const settings = integration.settings as Record<string, any>;
      const addressBookId = settings.addressBookId;
      const apiPassword = settings.apiPassword;

      if (!apiPassword) {
        throw new Error("Dotdigital API password not configured");
      }

      const isDemoMode = integration.apiKey === "demo";
      const client = isDemoMode
        ? new DotdigitalDemoClient()
        : new DotdigitalClient(integration.apiKey, apiPassword, integration.apiEndpoint || undefined);

      if (direction === "PULL" && addressBookId) {
        // Sync from Dotdigital to DeepCharity
        const contactsResponse = await client.getContacts(addressBookId);
        if (contactsResponse?.list) {
          for (const contact of contactsResponse.list) {
            recordsProcessed++;

            try {
              const existingContact = await prisma.contact.findFirst({
                where: { email: contact.email },
              });

              const firstName = contact.firstName || "Unknown";
              const lastName = contact.lastName || "Unknown";

              if (existingContact) {
                recordsUpdated++;
                await prisma.contact.update({
                  where: { id: existingContact.id },
                  data: {
                    firstName,
                    lastName,
                    phone: contact.phone,
                  },
                });
              } else {
                recordsCreated++;
                await prisma.contact.create({
                  data: {
                    firstName,
                    lastName,
                    email: contact.email,
                    phone: contact.phone,
                    types: ["DONOR"],
                  } as any,
                });
              }
            } catch (error) {
              recordsFailed++;
              errors.push({
                email: contact.email,
                message: String(error),
              });
            }
          }
        }
      }
    }

    // Update sync log with completion
    const completedLog = await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        errors,
      },
    });

    // Update integration last sync time
    await prisma.emailMarketingSync.update({
      where: { id },
      data: {
        lastSyncAt: new Date(),
        status: recordsFailed === 0 ? "CONNECTED" : "ERROR",
      },
    });

    return NextResponse.json({
      success: true,
      syncLog: completedLog,
    });
  } catch (error) {
    // Mark sync as failed
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errors: [{ message: String(error) }],
      },
    });

    // Update integration status
    await prisma.emailMarketingSync.update({
      where: { id },
      data: { status: "ERROR" },
    });

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
