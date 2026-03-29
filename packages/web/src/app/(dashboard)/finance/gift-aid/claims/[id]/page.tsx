import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Check, X, AlertCircle, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claim = await prisma.giftAidClaim.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          claim: true,
        },
      },
      createdBy: true,
    },
  });

  if (!claim) notFound();

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    SUBMITTED: "bg-blue-100 text-blue-800",
    ACCEPTED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    PARTIAL: "bg-yellow-100 text-yellow-800",
  };

  const itemStatusColors: Record<string, string> = {
    INCLUDED: "bg-green-100 text-green-800",
    EXCLUDED: "bg-gray-100 text-gray-800",
    ERROR: "bg-red-100 text-red-800",
  };

  async function submitClaim() {
    "use server";
    await requireAuth();

    await prisma.giftAidClaim.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    revalidatePath(`/finance/gift-aid/claims/${id}`);
  }

  async function markAccepted(formData: FormData) {
    "use server";
    await requireAuth();

    const hmrcReference = formData.get("hmrcReference") as string;
    const amountReceived = formData.get("amountReceived") as string;

    const currentClaim = await prisma.giftAidClaim.findUnique({ where: { id } });
    if (!currentClaim) return;

    await prisma.giftAidClaim.update({
      where: { id },
      data: {
        status: amountReceived ? (parseFloat(amountReceived) < currentClaim.totalClaimable ? "PARTIAL" : "ACCEPTED") : "ACCEPTED",
        acceptedAt: new Date(),
        hmrcReference: hmrcReference || undefined,
        amountReceived: amountReceived ? parseFloat(amountReceived) : undefined,
      },
    });

    revalidatePath(`/finance/gift-aid/claims/${id}`);
  }

  async function markRejected(formData: FormData) {
    "use server";
    await requireAuth();

    const rejectionReason = formData.get("rejectionReason") as string;
    const hmrcReference = formData.get("hmrcReference") as string;

    await prisma.giftAidClaim.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectionReason: rejectionReason || undefined,
        hmrcReference: hmrcReference || undefined,
      },
    });

    revalidatePath(`/finance/gift-aid/claims/${id}`);
  }

  async function removeItem(itemId: string) {
    "use server";
    await requireAuth();

    // Get the item to find the donation
    const item = await prisma.giftAidClaimItem.findUnique({
      where: { id: itemId },
    });

    if (!item) return;

    // Delete the item
    await prisma.giftAidClaimItem.delete({
      where: { id: itemId },
    });

    // Mark donation as not claimed
    await prisma.donation.update({
      where: { id: item.donationId },
      data: { giftAidClaimed: false },
    });

    // Recalculate claim totals
    const remainingItems = await prisma.giftAidClaimItem.findMany({
      where: { claimId: id },
    });

    const newTotal = remainingItems.reduce((sum, i) => sum + i.donationAmount, 0);
    const newClaimable = newTotal * 0.25;

    await prisma.giftAidClaim.update({
      where: { id },
      data: {
        totalDonations: newTotal,
        totalClaimable: newClaimable,
        donationCount: remainingItems.length,
      },
    });

    revalidatePath(`/finance/gift-aid/claims/${id}`);
  }

  const includedItems = claim.items.filter((i) => i.status === "INCLUDED");
  const totalIncluded = includedItems.reduce((sum, i) => sum + i.donationAmount, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/finance/gift-aid/claims" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{claim.claimReference}</h1>
          <p className="text-gray-500 mt-1">Gift Aid claim to HMRC</p>
        </div>
        <Badge className={statusColors[claim.status]}>{claim.status}</Badge>
      </div>

      {/* Claim Summary */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Claim Summary</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Donations
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                £{claim.totalDonations.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{claim.donationCount} donations</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Claim Amount (25%)
              </p>
              <p className="text-2xl font-bold text-indigo-600 mt-2">
                £{claim.totalClaimable.toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted Date
              </p>
              <p className="text-sm text-gray-900 mt-2">
                {claim.submittedAt ? formatDate(claim.submittedAt) : "Not submitted"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                HMRC Reference
              </p>
              <p className="text-sm text-gray-900 mt-2">
                {claim.hmrcReference ? (
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {claim.hmrcReference}
                  </code>
                ) : (
                  "Pending"
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Claim Items</h3>
          {claim.status === "DRAFT" && (
            <Link href={`/finance/gift-aid/claims/${id}/add-donations`}>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Donations
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Name
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {claim.status === "DRAFT" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {claim.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{item.donorName}</div>
                      {item.donorPostcode && (
                        <div className="text-xs text-gray-500">{item.donorPostcode}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(item.donationDate)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      £{item.donationAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-indigo-600 font-medium">
                      £{item.giftAidAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={itemStatusColors[item.status]}>
                        {item.status}
                      </Badge>
                    </td>
                    {claim.status === "DRAFT" && (
                      <td className="px-6 py-4">
                        <form
                          action={async () => {
                            "use server";
                            await removeItem(item.id);
                          }}
                        >
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Actions based on status */}
      {claim.status === "DRAFT" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <h3 className="text-lg font-semibold text-blue-900">Ready to Submit?</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 mb-4">
              Review the claim details above. Once submitted, this claim will be sent to HMRC.
            </p>
            <form action={submitClaim}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <FileCheck className="h-4 w-4 mr-2" />
                Submit Claim to HMRC
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {claim.status === "SUBMITTED" && !claim.acceptedAt && !claim.rejectedAt && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mark Accepted */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <h3 className="text-lg font-semibold text-green-900">Mark as Accepted</h3>
            </CardHeader>
            <CardContent>
              <form action={markAccepted} className="space-y-4">
                <Input
                  label="HMRC Reference"
                  name="hmrcReference"
                  placeholder="e.g., HMRC-2024-001"
                />
                <Input
                  label="Amount Received (leave blank if full amount)"
                  name="amountReceived"
                  type="number"
                  step="0.01"
                  placeholder={`Leave blank for £${claim.totalClaimable.toFixed(2)}`}
                />
                <Button type="submit" className="bg-green-600 hover:bg-green-700 w-full">
                  <Check className="h-4 w-4 mr-2" />
                  Mark as Accepted
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Mark Rejected */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <h3 className="text-lg font-semibold text-red-900">Mark as Rejected</h3>
            </CardHeader>
            <CardContent>
              <form action={markRejected} className="space-y-4">
                <Input
                  label="HMRC Reference (optional)"
                  name="hmrcReference"
                  placeholder="e.g., HMRC-2024-001"
                />
                <Input
                  label="Rejection Reason"
                  name="rejectionReason"
                  placeholder="Explain why the claim was rejected..."
                />
                <Button type="submit" className="bg-red-600 hover:bg-red-700 w-full">
                  <X className="h-4 w-4 mr-2" />
                  Mark as Rejected
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {claim.status === "ACCEPTED" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Claim Accepted</p>
                <p className="text-sm text-green-700 mt-1">
                  HMRC Reference: {claim.hmrcReference}
                </p>
                {claim.amountReceived && (
                  <p className="text-sm text-green-700">
                    Amount Received: £{claim.amountReceived.toFixed(2)}
                  </p>
                )}
                {claim.acceptedAt && (
                  <p className="text-sm text-green-700">
                    Accepted on {formatDate(claim.acceptedAt)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {claim.status === "PARTIAL" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Partial Acceptance</p>
                <p className="text-sm text-yellow-700 mt-1">
                  HMRC Reference: {claim.hmrcReference}
                </p>
                {claim.amountReceived && (
                  <p className="text-sm text-yellow-700">
                    Amount Received: £{claim.amountReceived.toFixed(2)} of £
                    {claim.totalClaimable.toFixed(2)}
                  </p>
                )}
                {claim.acceptedAt && (
                  <p className="text-sm text-yellow-700">
                    Accepted on {formatDate(claim.acceptedAt)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {claim.status === "REJECTED" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <X className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Claim Rejected</p>
                {claim.hmrcReference && (
                  <p className="text-sm text-red-700 mt-1">
                    HMRC Reference: {claim.hmrcReference}
                  </p>
                )}
                {claim.rejectionReason && (
                  <p className="text-sm text-red-700 mt-1">
                    Reason: {claim.rejectionReason}
                  </p>
                )}
                {claim.rejectedAt && (
                  <p className="text-sm text-red-700">
                    Rejected on {formatDate(claim.rejectedAt)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back Button */}
      <div className="flex justify-start">
        <Link href="/finance/gift-aid/claims">
          <Button variant="outline">Back to Claims</Button>
        </Link>
      </div>
    </div>
  );
}
