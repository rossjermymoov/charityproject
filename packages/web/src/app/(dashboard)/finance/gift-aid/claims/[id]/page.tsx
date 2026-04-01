import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  markClaimReady,
  submitToHmrc,
  checkHmrcStatus,
  resetClaim,
  deleteClaim,
} from "../actions";

export default async function GiftAidClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const claim = await prisma.giftAidClaim.findUnique({
    where: { id },
    include: {
      items: true,
      createdBy: { select: { name: true } },
    },
  });

  if (!claim) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    READY: "bg-blue-100 text-blue-800",
    SUBMITTED: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    PARTIAL: "bg-orange-100 text-orange-800",
  };

  const statusIcons: Record<string, any> = {
    DRAFT: null,
    READY: AlertCircle,
    SUBMITTED: Clock,
    ACCEPTED: CheckCircle,
    REJECTED: XCircle,
    PARTIAL: AlertCircle,
  };

  const StatusIcon = statusIcons[claim.status];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/finance" className="hover:text-gray-700">
            Finance
          </Link>
          <span>/</span>
          <Link href="/finance/gift-aid" className="hover:text-gray-700">
            Gift Aid
          </Link>
          <span>/</span>
          <Link href="/finance/gift-aid/claims" className="hover:text-gray-700">
            Claims
          </Link>
          <span>/</span>
          <span>{claim.claimReference}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/finance/gift-aid/claims" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{claim.claimReference}</h1>
              <Badge className={statusColors[claim.status]}>
                {StatusIcon && <StatusIcon className="h-3 w-3 mr-1 inline" />}
                {claim.status}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              {formatDate(claim.periodStart)} to {formatDate(claim.periodEnd)}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500">Total Donations</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {claim.donationCount}
            </p>
            <p className="text-sm text-gray-600 mt-1">{formatCurrency(claim.totalDonations)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500">Claimable Amount</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">
              {formatCurrency(claim.totalClaimable)}
            </p>
            <p className="text-xs text-gray-500 mt-1">25% Gift Aid on donations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500">Status</p>
            <div className="mt-2">
              {claim.status === "ACCEPTED" && (
                <>
                  <p className="text-lg font-bold text-green-600">Accepted</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Received: {claim.amountReceived ? formatCurrency(claim.amountReceived) : "—"}
                  </p>
                </>
              )}
              {claim.status === "REJECTED" && (
                <>
                  <p className="text-lg font-bold text-red-600">Rejected</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {claim.rejectionReason || "No reason provided"}
                  </p>
                </>
              )}
              {claim.status === "SUBMITTED" && (
                <>
                  <p className="text-lg font-bold text-yellow-600">Submitted</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {claim.correlationId ? `ID: ${claim.correlationId}` : "Awaiting response"}
                  </p>
                </>
              )}
              {["DRAFT", "READY"].includes(claim.status) && (
                <p className="text-sm text-gray-600">Not yet submitted</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {claim.status === "DRAFT" && (
              <>
                <form action={markClaimReady} className="inline">
                  <input type="hidden" name="claimId" value={claim.id} />
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 gap-1"
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4" /> Mark as Ready
                  </Button>
                </form>
                <form action={deleteClaim} className="inline" onSubmit={(e) => {
                  if (!window.confirm("Are you sure you want to delete this claim?")) {
                    e.preventDefault();
                  }
                }}>
                  <input type="hidden" name="claimId" value={claim.id} />
                  <Button type="submit" variant="outline" size="sm" className="text-red-600">
                    Delete
                  </Button>
                </form>
              </>
            )}
            {claim.status === "READY" && (
              <form action={submitToHmrc} className="inline">
                <input type="hidden" name="claimId" value={claim.id} />
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 gap-1"
                  size="sm"
                >
                  Submit to HMRC
                </Button>
              </form>
            )}
            {claim.status === "SUBMITTED" && (
              <form action={checkHmrcStatus} className="inline">
                <input type="hidden" name="claimId" value={claim.id} />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                >
                  Check Status
                </Button>
              </form>
            )}
            {claim.status === "REJECTED" && (
              <form action={resetClaim} className="inline">
                <input type="hidden" name="claimId" value={claim.id} />
                <Button type="submit" variant="outline" size="sm">
                  Reset to Draft
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Claim Items */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Claim Items ({claim.items.length})
          </h2>
          {claim.items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No donations in this claim</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Donor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Postcode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gift Aid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {claim.items.map((item) => (
                    <tr
                      key={item.id}
                      className={item.status === "ERROR" ? "bg-red-50" : "hover:bg-gray-50"}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.donorName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.donorPostcode || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(item.donationDate)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.donationAmount)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-indigo-600 text-right">
                        {formatCurrency(item.giftAidAmount)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {item.status === "INCLUDED" && (
                          <Badge className="bg-green-100 text-green-800">Included</Badge>
                        )}
                        {item.status === "EXCLUDED" && (
                          <Badge className="bg-gray-100 text-gray-800">Excluded</Badge>
                        )}
                        {item.status === "ERROR" && (
                          <div>
                            <Badge className="bg-red-100 text-red-800">Error</Badge>
                            <p className="text-xs text-red-700 mt-1">{item.errorReason}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Trail */}
      {claim.status === "SUBMITTED" && claim.correlationId && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Correlation ID</dt>
                <dd className="mt-1 font-mono text-sm text-gray-900">{claim.correlationId}</dd>
              </div>
              {claim.submittedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Submitted At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(claim.submittedAt)}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
