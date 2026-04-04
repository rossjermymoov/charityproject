import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { getNextClaimReference, calculateGiftAid, isValidUKPostcode } from "@/lib/hmrc";
import { createClaim } from "../actions";
import { ClaimableTable } from "./claimable-table";

export default async function NewGiftAidClaimPage() {
  const session = await requireAuth();

  const now = new Date();
  const currentYear = now.getFullYear();

  // Get the last submitted/accepted claim to determine period start
  const lastClaim = await prisma.giftAidClaim.findFirst({
    where: {
      status: { in: ["SUBMITTED", "ACCEPTED", "PARTIAL"] },
    },
    orderBy: { periodEnd: "desc" },
  });

  // Default period: day after last claim's end, or start of current tax year
  const defaultStart = lastClaim
    ? new Date(new Date(lastClaim.periodEnd).getTime() + 86400000)
    : new Date(currentYear, 0, 1); // Jan 1 if no previous claim
  const defaultEnd = now;

  const periodStart = defaultStart.toISOString().split("T")[0];
  const periodEnd = defaultEnd.toISOString().split("T")[0];

  // Count claims in year for reference generation
  const claimsInYear = await prisma.giftAidClaim.count({
    where: {
      createdAt: {
        gte: new Date(currentYear, 0, 1),
        lt: new Date(currentYear + 1, 0, 1),
      },
    },
  });
  const nextReference = getNextClaimReference(currentYear, claimsInYear);

  // Find all eligible donations (gift-aidable, not already claimed, with active declaration)
  const eligibleDonations = await prisma.donation.findMany({
    where: {
      AND: [
        { isGiftAidable: true },
        { giftAidClaimed: false },
        { status: "RECEIVED" },
        { date: { gte: defaultStart } },
        { date: { lte: defaultEnd } },
        {
          contact: {
            giftAids: {
              some: {
                status: "ACTIVE",
                startDate: { lte: defaultEnd },
                OR: [
                  { endDate: null },
                  { endDate: { gte: defaultStart } },
                ],
              },
            },
          },
        },
      ],
    },
    include: {
      contact: {
        select: {
          firstName: true,
          lastName: true,
          postcode: true,
          addressLine1: true,
          city: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });

  // Map to client-safe format
  const donations = eligibleDonations.map((d) => ({
    id: d.id,
    contactId: d.contactId,
    contactName: `${d.contact.firstName || ""} ${d.contact.lastName || ""}`.trim(),
    postcode: d.contact.postcode,
    amount: d.amount,
    date: d.date.toISOString(),
    type: d.type,
    method: d.method,
    reference: d.reference,
    giftAidAmount: calculateGiftAid(d.amount),
    hasValidPostcode: d.contact.postcode ? isValidUKPostcode(d.contact.postcode) : false,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/finance" className="hover:text-gray-700">Finance</Link>
          <span>/</span>
          <Link href="/finance/gift-aid" className="hover:text-gray-700">Gift Aid</Link>
          <span>/</span>
          <Link href="/finance/gift-aid/claims" className="hover:text-gray-700">Claims</Link>
          <span>/</span>
          <span>New Claim</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/finance/gift-aid/claims" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              New Gift Aid Claim — {nextReference}
            </h1>
            <p className="text-gray-500 mt-1">
              {lastClaim
                ? `Covering donations since ${new Date(lastClaim.periodEnd).toLocaleDateString("en-GB")}`
                : "Covering all unclaimed eligible donations this year"}
              {" · "}
              {donations.length} eligible donation{donations.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>
      </div>

      {donations.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="pt-6 pb-6">
            <div className="text-center py-8">
              <Info className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No eligible donations found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto text-sm">
                There are no unclaimed gift-aidable donations from donors with active
                declarations in the period {new Date(periodStart).toLocaleDateString("en-GB")}{" "}
                to {new Date(periodEnd).toLocaleDateString("en-GB")}.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ClaimableTable
          donations={donations}
          claimReference={nextReference}
          periodStart={periodStart}
          periodEnd={periodEnd}
          createAction={createClaim}
        />
      )}
    </div>
  );
}
