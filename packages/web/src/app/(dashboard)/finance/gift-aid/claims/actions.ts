"use server";

import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { calculateGiftAid } from "@/lib/hmrc";

/**
 * Create a new Gift Aid claim with eligible donations
 */
export async function createClaim(formData: FormData) {
  const session = await requireAuth();

  const reference = (formData.get("reference") as string) || "";
  const periodStartStr = formData.get("periodStart") as string;
  const periodEndStr = formData.get("periodEnd") as string;

  if (!periodStartStr || !periodEndStr) {
    redirect("/finance/gift-aid/claims/new?error=missing-dates");
  }

  const periodStart = new Date(periodStartStr);
  const periodEnd = new Date(periodEndStr);

  // Find eligible donations
  const eligibleDonations = await prisma.donation.findMany({
    where: {
      AND: [
        { isGiftAidable: true },
        { date: { gte: periodStart } },
        { date: { lte: periodEnd } },
        {
          contact: {
            giftAids: {
              some: {
                status: "ACTIVE",
                startDate: { lte: periodEnd },
                OR: [
                  { endDate: null },
                  { endDate: { gte: periodStart } },
                ],
              },
            },
          },
        },
      ],
    },
    include: {
      contact: { select: { firstName: true, lastName: true, postcode: true } },
    },
  });

  if (eligibleDonations.length === 0) {
    redirect(
      "/finance/gift-aid/claims/new?error=no-eligible-donations"
    );
  }

  // Calculate totals
  let totalDonations = 0;
  let totalClaimable = 0;

  const items = eligibleDonations.map((donation) => {
    totalDonations += donation.amount;
    const giftAid = calculateGiftAid(donation.amount);
    totalClaimable += giftAid;

    return {
      donationId: donation.id,
      contactId: donation.contactId,
      donorName: `${donation.contact.firstName} ${donation.contact.lastName}`,
      donorPostcode: donation.contact.postcode,
      donationDate: donation.date,
      donationAmount: donation.amount,
      giftAidAmount: giftAid,
      status: "INCLUDED" as const,
      errorReason: null,
    };
  });

  // Create claim with items
  const claim = await prisma.giftAidClaim.create({
    data: {
      claimReference: reference,
      periodStart,
      periodEnd,
      status: "DRAFT",
      totalDonations,
      totalClaimable,
      donationCount: eligibleDonations.length,
      createdById: session.id,
      items: {
        createMany: {
          data: items,
        },
      },
    },
  });

  await logAudit({
    userId: session.id,
    action: "CREATE",
    entityType: "GiftAidClaim",
    entityId: claim.id,
    details: {
      reference: claim.claimReference,
      donationCount: claim.donationCount,
      totalClaimable: claim.totalClaimable,
    },
  });

  revalidatePath("/finance/gift-aid/claims");
  redirect(`/finance/gift-aid/claims/${claim.id}`);
}

/**
 * Mark claim as ready for submission
 */
export async function markClaimReady(formData: FormData) {
  const session = await requireAuth();
  const claimId = formData.get("claimId") as string;

  const claim = await prisma.giftAidClaim.findUnique({
    where: { id: claimId },
    include: { items: true },
  });

  if (!claim) return;
  if (claim.status !== "DRAFT") return;

  // Validate items have no errors
  const errorItems = claim.items.filter((item) => item.status === "ERROR");
  if (errorItems.length > 0) {
    redirect(`/finance/gift-aid/claims/${claimId}?error=items-have-errors`);
  }

  await prisma.giftAidClaim.update({
    where: { id: claimId },
    data: { status: "READY" },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "GiftAidClaim",
    entityId: claimId,
    details: { newStatus: "READY" },
  });

  revalidatePath(`/finance/gift-aid/claims/${claimId}`);
  redirect(`/finance/gift-aid/claims/${claimId}`);
}

/**
 * Submit claim to HMRC
 * TODO: Implement real HMRC submission
 */
export async function submitToHmrc(formData: FormData) {
  const session = await requireAuth();
  const claimId = formData.get("claimId") as string;

  const claim = await prisma.giftAidClaim.findUnique({
    where: { id: claimId },
    include: { items: true },
  });

  if (!claim) return;
  if (claim.status !== "READY") return;

  /**
   * TODO: Real HMRC Submission
   * ────────────────────────────────
   *
   * 1. Build GovTalk XML with donation items
   * 2. Generate IRmark digital signature
   * 3. Retrieve HMRC credentials from SystemSettings
   * 4. Submit via Government Gateway endpoint (HTTPS POST)
   * 5. HMRC will return:
   *    - Correlation ID for polling
   *    - Acknowledgement of receipt
   * 6. Store submission XML and timestamp
   * 7. Set up polling mechanism to check status:
   *    - Poll endpoint periodically (e.g., 5 mins, 1 hour, 1 day)
   *    - Look for acceptance, rejection, or partial acceptance
   * 8. Once response received:
   *    - Update status (ACCEPTED, REJECTED, PARTIAL)
   *    - Store HMRC reference
   *    - Store response XML
   * 9. Full audit trail: keep submission XML and response for 6+ years
   *
   * Spec: https://www.gov.uk/guidance/submit-gift-aid-claims-online
   * GovTalk: https://www.gov.uk/government/collections/govtalk
   */

  // For now: generate mock correlation ID and set to SUBMITTED state
  const correlationId = `MOCK-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  await prisma.giftAidClaim.update({
    where: { id: claimId },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      correlationId,
    },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "GiftAidClaim",
    entityId: claimId,
    details: {
      newStatus: "SUBMITTED",
      correlationId,
      note: "Mock submission for development",
    },
  });

  revalidatePath(`/finance/gift-aid/claims/${claimId}`);
  redirect(`/finance/gift-aid/claims/${claimId}`);
}

/**
 * Check HMRC submission status via polling
 * TODO: Implement real status checking
 */
export async function checkHmrcStatus(formData: FormData) {
  const session = await requireAuth();
  const claimId = formData.get("claimId") as string;

  const claim = await prisma.giftAidClaim.findUnique({
    where: { id: claimId },
  });

  if (!claim) return;
  if (claim.status !== "SUBMITTED") return;

  /**
   * TODO: Real HMRC Status Polling
   * ──────────────────────────────
   *
   * 1. Use correlationId from claim to poll Government Gateway
   * 2. Send status check request with:
   *    - Charity reference
   *    - Correlation ID
   *    - Government Gateway credentials
   * 3. HMRC returns status:
   *    - PENDING: still processing
   *    - ACCEPTED: claim approved, HMRC reference provided
   *    - REJECTED: claim rejected with reason
   *    - PARTIAL: some donations accepted, some rejected
   * 4. Update claim record with response
   * 5. If accepted, set status to ACCEPTED and store hmrcReference + amountReceived
   * 6. If rejected, set status to REJECTED and store rejectionReason
   * 7. Store response XML for audit trail
   *
   * Note: HMRC processing typically takes 3-5 working days
   */

  // For now: placeholder that shows "checking..."
  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "GiftAidClaim",
    entityId: claimId,
    details: {
      action: "check_status",
      note: "Mock status check for development",
    },
  });

  revalidatePath(`/finance/gift-aid/claims/${claimId}`);
  redirect(`/finance/gift-aid/claims/${claimId}?status=checked`);
}

/**
 * Reset claim from REJECTED back to DRAFT
 */
export async function resetClaim(formData: FormData) {
  const session = await requireAuth();
  const claimId = formData.get("claimId") as string;

  const claim = await prisma.giftAidClaim.findUnique({
    where: { id: claimId },
  });

  if (!claim) return;
  if (claim.status !== "REJECTED") return;

  await prisma.giftAidClaim.update({
    where: { id: claimId },
    data: {
      status: "DRAFT",
      submittedAt: null,
      correlationId: null,
      rejectionReason: null,
    },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "GiftAidClaim",
    entityId: claimId,
    details: { resetFrom: "REJECTED", newStatus: "DRAFT" },
  });

  revalidatePath(`/finance/gift-aid/claims/${claimId}`);
  redirect(`/finance/gift-aid/claims/${claimId}`);
}

/**
 * Delete a claim (only if DRAFT)
 */
export async function deleteClaim(formData: FormData) {
  const session = await requireAuth();
  const claimId = formData.get("claimId") as string;

  const claim = await prisma.giftAidClaim.findUnique({
    where: { id: claimId },
  });

  if (!claim) return;
  if (claim.status !== "DRAFT") return;

  const reference = claim.claimReference;

  // Delete items first (cascade)
  await prisma.giftAidClaimItem.deleteMany({
    where: { claimId },
  });

  // Delete claim
  await prisma.giftAidClaim.delete({
    where: { id: claimId },
  });

  await logAudit({
    userId: session.id,
    action: "DELETE",
    entityType: "GiftAidClaim",
    entityId: claimId,
    details: { reference },
  });

  revalidatePath("/finance/gift-aid/claims");
  redirect("/finance/gift-aid/claims");
}
