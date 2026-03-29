import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  getPageDetails,
  getPageDonations,
  transformDonation,
} from "@/lib/justgiving";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/justgiving/sync
 * Body: { fundraisingPageId: string }
 *
 * Syncs donations from a JustGiving fundraising page into the system.
 * The page belongs to a Contact (the fundraiser), not an Event.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fundraisingPageId } = await request.json();
    if (!fundraisingPageId) {
      return NextResponse.json(
        { error: "Missing fundraisingPageId" },
        { status: 400 }
      );
    }

    const page = await prisma.fundraisingPage.findUnique({
      where: { id: fundraisingPageId },
      include: { contact: true },
    });
    if (!page) {
      return NextResponse.json(
        { error: "Fundraising page not found" },
        { status: 404 }
      );
    }

    const slug = page.pageSlug;

    // 1. Get page details for totals
    const pageDetails = await getPageDetails(slug);

    // 2. Get all donations
    const jgDonations = await getPageDonations(slug);

    // Update page totals regardless
    const totalRaised = pageDetails?.grandTotalRaisedExcludingGiftAid || page.totalRaised;
    const giftAidTotal = pageDetails?.totalEstimatedGiftAid || page.giftAidTotal;

    if (!jgDonations || jgDonations.length === 0) {
      await prisma.fundraisingPage.update({
        where: { id: fundraisingPageId },
        data: {
          lastSyncAt: new Date(),
          totalRaised,
          giftAidTotal,
          title: pageDetails?.title || page.title,
          targetAmount: pageDetails?.targetAmount || page.targetAmount,
        },
      });

      return NextResponse.json({
        success: true,
        synced: 0,
        skipped: 0,
        total: 0,
        totalRaised,
        giftAidTotal,
      });
    }

    // 3. Check for existing donations to avoid duplicates
    const existingIds = new Set(
      (
        await prisma.fundraisingDonation.findMany({
          where: { fundraisingPageId },
          select: { externalId: true },
        })
      ).map((d) => d.externalId)
    );

    // Get a system user for creating finance records
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
      const externalId = String(jgDonation.id);

      if (existingIds.has(externalId)) {
        skipped++;
        continue;
      }

      const donationData = transformDonation(jgDonation);

      // Create FundraisingDonation record
      const frRecord = await prisma.fundraisingDonation.create({
        data: {
          fundraisingPageId,
          ...donationData,
        },
      });

      // Also create a Donation in the main finance ledger linked to the fundraiser contact
      const donation = await prisma.donation.create({
        data: {
          contactId: page.contactId,
          amount: donationData.amount,
          type: "DONATION",
          method: "ONLINE",
          date: donationData.donationDate,
          eventId: page.eventId || undefined,
          isGiftAidable: donationData.isGiftAidEligible,
          giftAidClaimed: false,
          status: "RECEIVED",
          reference: `JG-${externalId}`,
          notes: `JustGiving donation via ${page.contact.firstName}'s page${jgDonation.donorDisplayName ? ` from ${jgDonation.donorDisplayName}` : ""}${jgDonation.message ? `: "${jgDonation.message}"` : ""}`,
          createdById: systemUser.id,
        },
      });

      // Link the finance donation back to the fundraising donation
      await prisma.fundraisingDonation.update({
        where: { id: frRecord.id },
        data: { donationId: donation.id },
      });

      synced++;
    }

    // 4. Update the fundraising page with sync info
    await prisma.fundraisingPage.update({
      where: { id: fundraisingPageId },
      data: {
        lastSyncAt: new Date(),
        totalRaised,
        giftAidTotal,
        title: pageDetails?.title || page.title,
        targetAmount: pageDetails?.targetAmount || page.targetAmount,
      },
    });

    await logAudit({
      userId: session.id,
      action: "UPDATE",
      entityType: "FundraisingPage",
      entityId: fundraisingPageId,
      details: { action: "justgiving_sync", synced, skipped, contactId: page.contactId },
    });

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      total: jgDonations.length,
      totalRaised,
      giftAidTotal,
    });
  } catch (error) {
    console.error("[justgiving/sync] Error:", error);
    return NextResponse.json(
      { error: "Sync failed. Please try again." },
      { status: 500 }
    );
  }
}
