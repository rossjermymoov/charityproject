import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  getPageDetails,
  getPageDonations,
  transformDonation,
} from "@/lib/justgiving";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await request.json();
    if (!eventId) {
      return NextResponse.json(
        { error: "Missing eventId" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || !event.justGivingPageSlug) {
      return NextResponse.json(
        { error: "Event not found or no JustGiving page linked" },
        { status: 404 }
      );
    }

    const slug = event.justGivingPageSlug;

    // 1. Get page details for total raised
    const pageDetails = await getPageDetails(slug);

    // 2. Get all donations
    const jgDonations = await getPageDonations(slug);

    if (!jgDonations || jgDonations.length === 0) {
      // Still update the sync timestamp and totals
      await prisma.event.update({
        where: { id: eventId },
        data: {
          justGivingLastSyncAt: new Date(),
          justGivingTotalRaised: pageDetails?.grandTotalRaisedExcludingGiftAid || event.justGivingTotalRaised,
        },
      });

      return NextResponse.json({
        success: true,
        synced: 0,
        skipped: 0,
        total: 0,
        totalRaised: pageDetails?.grandTotalRaisedExcludingGiftAid || 0,
      });
    }

    // 3. Get existing JG donation IDs for this event to avoid duplicates
    const existingIds = new Set(
      (
        await prisma.justGivingDonation.findMany({
          where: { eventId },
          select: { justGivingId: true },
        })
      ).map((d) => d.justGivingId)
    );

    // Get a system user for creating records
    const systemUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!systemUser) {
      return NextResponse.json(
        { error: "No admin user found" },
        { status: 500 }
      );
    }

    let synced = 0;
    let skipped = 0;

    for (const jgDonation of jgDonations) {
      const jgId = String(jgDonation.id);

      if (existingIds.has(jgId)) {
        skipped++;
        continue;
      }

      const donationData = transformDonation(jgDonation, eventId);

      // Try to match donor to an existing contact by name
      let contactId: string | null = null;
      if (jgDonation.donorDisplayName && jgDonation.donorDisplayName !== "Anonymous") {
        const nameParts = jgDonation.donorDisplayName.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        if (firstName && lastName) {
          const matchedContact = await prisma.contact.findFirst({
            where: {
              firstName: { equals: firstName, mode: "insensitive" },
              lastName: { equals: lastName, mode: "insensitive" },
            },
          });
          contactId = matchedContact?.id || null;
        }
      }

      // Create the JustGivingDonation record
      const jgRecord = await prisma.justGivingDonation.create({
        data: {
          ...donationData,
          contactId,
        },
      });

      // Also create a Donation record in the main finance ledger
      const donation = await prisma.donation.create({
        data: {
          contactId: contactId || undefined!,
          amount: donationData.amount,
          type: "DONATION",
          method: "ONLINE",
          date: donationData.donationDate,
          eventId,
          isGiftAidable: donationData.isGiftAidEligible,
          giftAidClaimed: false,
          status: "RECEIVED",
          reference: `JG-${jgId}`,
          notes: `JustGiving donation${jgDonation.donorDisplayName ? ` from ${jgDonation.donorDisplayName}` : ""}${jgDonation.message ? `: "${jgDonation.message}"` : ""}`,
          createdById: systemUser.id,
        },
      });

      // Link the donation record back
      await prisma.justGivingDonation.update({
        where: { id: jgRecord.id },
        data: { donationId: donation.id },
      });

      synced++;
    }

    // 4. Update event with sync info
    await prisma.event.update({
      where: { id: eventId },
      data: {
        justGivingLastSyncAt: new Date(),
        justGivingTotalRaised:
          pageDetails?.grandTotalRaisedExcludingGiftAid ||
          event.justGivingTotalRaised,
      },
    });

    await logAudit({
      userId: session.id,
      action: "UPDATE",
      entityType: "Event",
      entityId: eventId,
      details: { action: "justgiving_sync", synced, skipped },
    });

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      total: jgDonations.length,
      totalRaised: pageDetails?.grandTotalRaisedExcludingGiftAid || 0,
      giftAidTotal: pageDetails?.totalEstimatedGiftAid || 0,
    });
  } catch (error) {
    console.error("[justgiving/sync] Error:", error);
    return NextResponse.json(
      { error: "Sync failed. Please try again." },
      { status: 500 }
    );
  }
}
