import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

export default async function GiftAidClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const statusFilter = params.status || "";

  const claims = await prisma.giftAidClaim.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    include: {
      items: true,
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    READY: "bg-blue-100 text-blue-800",
    SUBMITTED: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    PARTIAL: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <span>Claims</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Gift Aid Claims</h1>
          <p className="text-gray-500 mt-1">
            Create and manage Gift Aid claims to submit to HMRC
          </p>
        </div>
        <Link href="/finance/gift-aid/claims/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 gap-1">
            <Plus className="h-4 w-4" /> New Claim
          </Button>
        </Link>
      </div>

      {/* Status Filter */}
      {claims.length > 0 && (
        <Card className="p-4">
          <form className="flex gap-2 flex-wrap">
            <Button
              type="submit"
              name="status"
              value=""
              variant={!statusFilter ? "default" : "outline"}
              size="sm"
            >
              All Claims
            </Button>
            {(["DRAFT", "READY", "SUBMITTED", "ACCEPTED", "REJECTED", "PARTIAL"] as const).map(
              (status) => (
                <Button
                  key={status}
                  type="submit"
                  name="status"
                  value={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                >
                  {status}
                </Button>
              )
            )}
          </form>
        </Card>
      )}

      {/* Claims List */}
      {claims.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Gift Aid claims"
          description="Get started by creating your first Gift Aid claim to submit to HMRC."
          actionLabel="New Claim"
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
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claimable Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/finance/gift-aid/claims/${claim.id}`}
                        className="font-mono font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        {claim.claimReference}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(claim.periodStart)} to {formatDate(claim.periodEnd)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[claim.status]}>
                        {claim.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className="font-medium">{claim.donationCount}</span>
                      <span className="text-gray-500"> donations</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(claim.totalClaimable)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(claim.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
