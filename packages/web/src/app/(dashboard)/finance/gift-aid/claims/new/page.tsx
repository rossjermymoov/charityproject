import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function NewGiftAidClaimPage() {
  const eligibleDonations = await prisma.donation.findMany({
    where: {
      isGiftAidable: true,
      giftAidClaimed: false,
      status: "RECEIVED",
    },
    include: {
      contact: true,
    },
    orderBy: { date: "desc" },
  });

  async function createClaim(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const selectedIds = formData.getAll("selectedDonations") as string[];
    if (selectedIds.length === 0) {
      throw new Error("Please select at least one donation");
    }

    // Get selected donations with contact details
    const donations = await prisma.donation.findMany({
      where: { id: { in: selectedIds } },
      include: { contact: true },
    });

    // Calculate totals
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const totalClaimable = totalDonations * 0.25; // 25% of total

    // Generate unique reference
    const claimCount = await prisma.giftAidClaim.count();
    const claimReference = `CLAIM-${new Date().getFullYear()}-${String(claimCount + 1).padStart(4, "0")}`;

    // Create the claim
    const claim = await prisma.giftAidClaim.create({
      data: {
        claimReference,
        status: "DRAFT",
        totalDonations,
        totalClaimable,
        donationCount: donations.length,
        periodStart: new Date(new Date().getFullYear(), 0, 1), // Start of tax year
        periodEnd: new Date(new Date().getFullYear(), 11, 31), // End of tax year
        createdById: session.id,
        items: {
          create: donations.map((donation) => ({
            donationId: donation.id,
            contactId: donation.contactId,
            donorName: `${donation.contact.firstName} ${donation.contact.lastName}`,
            donorAddress: [donation.contact.addressLine1, donation.contact.addressLine2]
              .filter(Boolean)
              .join(", "),
            donorPostcode: donation.contact.postcode || "",
            donationDate: donation.date,
            donationAmount: donation.amount,
            giftAidAmount: donation.amount * 0.25,
            status: "INCLUDED",
          })),
        },
      },
    });

    // Mark donations as claimed
    await prisma.donation.updateMany({
      where: { id: { in: selectedIds } },
      data: { giftAidClaimed: true },
    });

    revalidatePath("/finance/gift-aid/claims");
    redirect(`/finance/gift-aid/claims/${claim.id}`);
  }

  const totalAmount = eligibleDonations.reduce((sum, d) => sum + d.amount, 0);
  const totalClaimable = totalAmount * 0.25;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/finance/gift-aid/claims" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Gift Aid Claim</h1>
      </div>

      {eligibleDonations.length === 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-amber-900">
              No eligible donations found. Ensure donations are marked as Gift Aidable and have not already been claimed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <form action={createClaim} className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-gray-500 mb-2">
                  Eligible Donations
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {eligibleDonations.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-gray-500 mb-2">
                  Total Amount
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  £{totalAmount.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-gray-500 mb-2">
                  Claim Amount (25%)
                </div>
                <div className="text-2xl font-bold text-indigo-600">
                  £{totalClaimable.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Donations Table */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">
                Select Donations
              </h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          id="selectAll"
                          className="h-4 w-4 rounded border-gray-300"
                          onChange={(e) => {
                            const checkboxes = document.querySelectorAll(
                              'input[name="selectedDonations"]'
                            );
                            checkboxes.forEach((cb: any) => {
                              cb.checked = e.target.checked;
                            });
                          }}
                          defaultChecked
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Donor Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Donation Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gift Aid (25%)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {eligibleDonations.map((donation) => (
                      <tr key={donation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            name="selectedDonations"
                            value={donation.id}
                            className="h-4 w-4 rounded border-gray-300"
                            defaultChecked
                          />
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900">
                            {donation.contact.firstName} {donation.contact.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {donation.contact.postcode}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(donation.date)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          £{donation.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-indigo-600 font-medium">
                          £{(donation.amount * 0.25).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link href="/finance/gift-aid/claims">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Create Claim
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
