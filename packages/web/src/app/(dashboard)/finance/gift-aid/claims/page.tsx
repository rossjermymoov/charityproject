import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, FileCheck, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function GiftAidClaimsPage() {
  const claims = await prisma.giftAidClaim.findMany({
    include: {
      items: true,
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate stats
  const stats = {
    totalClaimed: claims.reduce((sum, claim) => sum + claim.totalClaimable, 0),
    pendingClaims: claims.filter((c) => c.status === "SUBMITTED").length,
    acceptedValue: claims
      .filter((c) => c.status === "ACCEPTED" || c.status === "PARTIAL")
      .reduce((sum, claim) => {
        if (claim.status === "ACCEPTED") {
          return sum + claim.totalClaimable;
        } else if (claim.status === "PARTIAL" && claim.amountReceived) {
          return sum + claim.amountReceived;
        }
        return sum;
      }, 0),
    successRate:
      claims.length > 0
        ? ((claims.filter((c) => c.status === "ACCEPTED" || c.status === "PARTIAL").length / claims.length) * 100).toFixed(1)
        : 0,
  };

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    SUBMITTED: "bg-blue-100 text-blue-800",
    ACCEPTED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    PARTIAL: "bg-yellow-100 text-yellow-800",
  };

  const statusIcons: Record<string, React.ComponentType<{ className: string }>> = {
    DRAFT: AlertCircle,
    SUBMITTED: FileCheck,
    ACCEPTED: CheckCircle,
    REJECTED: XCircle,
    PARTIAL: AlertCircle,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gift Aid Claims</h1>
          <p className="text-gray-500 mt-1">Manage and track Gift Aid claims to HMRC</p>
        </div>
        <Link href="/finance/gift-aid/claims/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Claim
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-500 mb-2">Total Claimed</div>
            <div className="text-2xl font-bold text-gray-900">£{stats.totalClaimed.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-2">{claims.length} claims</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-500 mb-2">Pending Claims</div>
            <div className="text-2xl font-bold text-blue-600">{stats.pendingClaims}</div>
            <div className="text-xs text-gray-500 mt-2">Awaiting HMRC response</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-500 mb-2">Accepted Value</div>
            <div className="text-2xl font-bold text-green-600">£{stats.acceptedValue.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-2">Received or partial</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-500 mb-2">Success Rate</div>
            <div className="text-2xl font-bold text-indigo-600">{stats.successRate}%</div>
            <div className="text-xs text-gray-500 mt-2">Accepted claims</div>
          </CardContent>
        </Card>
      </div>

      {/* Claims Table */}
      {claims.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No Gift Aid claims"
          description="Get started by creating your first Gift Aid claim to HMRC."
          actionLabel="Create Claim"
          actionHref="/finance/gift-aid/claims/new"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Donations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim Amount (25%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HMRC Ref
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {claims.map((claim) => {
                  const StatusIcon = statusIcons[claim.status] || AlertCircle;
                  return (
                    <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/finance/gift-aid/claims/${claim.id}`}
                          className="font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          {claim.claimReference}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          <Badge className={statusColors[claim.status]}>{claim.status}</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        £{claim.totalDonations.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        £{claim.totalClaimable.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {claim.submittedAt ? formatDate(claim.submittedAt) : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {claim.hmrcReference ? (
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {claim.hmrcReference}
                          </code>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/finance/gift-aid/claims/${claim.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
