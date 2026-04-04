import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Send,
  FlaskConical,
  FileText,
  User,
  Calendar,
  Hash,
  Shield,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  markClaimReady,
  submitToHmrc,
  checkHmrcStatus,
  resetClaim,
  deleteClaim,
  toggleClaimItem,
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
      items: { orderBy: { donationDate: "desc" } },
      createdBy: { select: { name: true, email: true } },
      submittedBy: { select: { name: true, email: true } },
    },
  });

  if (!claim) notFound();

  // Get audit trail
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "GiftAidClaim",
      entityId: claim.id,
    },
    include: {
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Also get item-level audit logs
  const itemIds = claim.items.map((i) => i.id);
  const itemAuditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "GiftAidClaimItem",
      entityId: { in: itemIds },
    },
    include: {
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const allAuditLogs = [...auditLogs, ...itemAuditLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    READY: "bg-blue-100 text-blue-800",
    SUBMITTED: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    PARTIAL: "bg-orange-100 text-orange-800",
  };

  const includedItems = claim.items.filter((i) => i.status === "INCLUDED");
  const excludedItems = claim.items.filter((i) => i.status === "EXCLUDED");
  const errorItems = claim.items.filter((i) => i.status === "ERROR");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/finance" className="hover:text-gray-700">Finance</Link>
          <span>/</span>
          <Link href="/finance/gift-aid" className="hover:text-gray-700">Gift Aid</Link>
          <span>/</span>
          <Link href="/finance/gift-aid/claims" className="hover:text-gray-700">Claims</Link>
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
              <Badge className={statusColors[claim.status]}>{claim.status}</Badge>
              {claim.notes === "RETAIL" ? (
                <Badge className="bg-purple-100 text-purple-800">Retail</Badge>
              ) : claim.notes === "STANDARD" ? (
                <Badge className="bg-indigo-100 text-indigo-800">Standard</Badge>
              ) : null}
              {claim.isTestMode && (
                <Badge className="bg-amber-100 text-amber-800">
                  <FlaskConical className="h-3 w-3 mr-1 inline" />
                  Test Mode
                </Badge>
              )}
            </div>
            <p className="text-gray-500 mt-1">
              {formatDate(claim.periodStart)} to {formatDate(claim.periodEnd)}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Included Donations</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{includedItems.length}</p>
            <p className="text-xs text-gray-500">
              {formatCurrency(claim.totalDonations)} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Gift Aid Claimable</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {formatCurrency(claim.totalClaimable)}
            </p>
            <p className="text-xs text-gray-500">25% of included donations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Excluded</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{excludedItems.length}</p>
            <p className="text-xs text-gray-500">
              {errorItems.length > 0 ? `+ ${errorItems.length} errors` : "manually excluded"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium text-gray-500 uppercase">
              {claim.status === "ACCEPTED" ? "Amount Received" : "Status"}
            </p>
            {claim.status === "ACCEPTED" && (
              <>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {claim.amountReceived ? formatCurrency(claim.amountReceived) : "—"}
                </p>
                <p className="text-xs text-gray-500">
                  {claim.receivedAt ? `Received ${formatDate(claim.receivedAt)}` : ""}
                </p>
              </>
            )}
            {claim.status === "REJECTED" && (
              <>
                <p className="text-lg font-bold text-red-600 mt-1">Rejected</p>
                <p className="text-xs text-gray-500">{claim.rejectionReason || "No reason"}</p>
              </>
            )}
            {claim.status === "SUBMITTED" && (
              <>
                <p className="text-lg font-bold text-yellow-600 mt-1">Awaiting Response</p>
                <p className="text-xs text-gray-500 font-mono">
                  {claim.correlationId ? `ID: ${claim.correlationId}` : ""}
                </p>
              </>
            )}
            {["DRAFT", "READY"].includes(claim.status) && (
              <p className="text-sm text-gray-600 mt-2">Not yet submitted</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-2 items-center">
            {claim.status === "DRAFT" && (
              <>
                <form action={markClaimReady} className="inline">
                  <input type="hidden" name="claimId" value={claim.id} />
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 gap-1" size="sm">
                    <CheckCircle className="h-4 w-4" /> Mark as Ready
                  </Button>
                </form>
                <form action={deleteClaim} className="inline">
                  <input type="hidden" name="claimId" value={claim.id} />
                  <Button type="submit" variant="outline" size="sm" className="text-red-600">
                    Delete Claim
                  </Button>
                </form>
              </>
            )}
            {claim.status === "READY" && (
              <form action={submitToHmrc} className="inline">
                <input type="hidden" name="claimId" value={claim.id} />
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 gap-1" size="sm">
                  <Send className="h-4 w-4" />
                  {claim.isTestMode ? "Submit (Test Mode)" : "Submit to HMRC"}
                </Button>
              </form>
            )}
            {claim.status === "SUBMITTED" && (
              <form action={checkHmrcStatus} className="inline">
                <input type="hidden" name="claimId" value={claim.id} />
                <Button type="submit" variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-1" /> Check Status
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

      {/* Submission Details (for submitted/accepted/rejected) */}
      {["SUBMITTED", "ACCEPTED", "REJECTED", "PARTIAL"].includes(claim.status) && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-400" />
              Submission Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {claim.submittedBy && (
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Submitted By</p>
                      <p className="text-sm text-gray-900">{claim.submittedBy.name}</p>
                      <p className="text-xs text-gray-500">{claim.submittedBy.email}</p>
                    </div>
                  </div>
                )}
                {claim.submittedAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Submitted At</p>
                      <p className="text-sm text-gray-900">
                        {new Date(claim.submittedAt).toLocaleString("en-GB")}
                      </p>
                    </div>
                  </div>
                )}
                {claim.correlationId && (
                  <div className="flex items-start gap-3">
                    <Hash className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Correlation ID</p>
                      <p className="text-sm font-mono text-gray-900">{claim.correlationId}</p>
                    </div>
                  </div>
                )}
                {claim.hmrcReference && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">HMRC Reference</p>
                      <p className="text-sm font-mono font-bold text-gray-900">
                        {claim.hmrcReference}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {claim.hmrcResponse && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                      HMRC Response
                    </p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {claim.hmrcResponse}
                    </p>
                  </div>
                )}
                {claim.acceptedAt && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Accepted At</p>
                    <p className="text-sm text-gray-900">
                      {new Date(claim.acceptedAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                )}
                {claim.rejectedAt && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Rejected At</p>
                    <p className="text-sm text-gray-900">
                      {new Date(claim.rejectedAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Created By */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span>
              Created by <strong>{claim.createdBy.name}</strong> on{" "}
              {new Date(claim.createdAt).toLocaleString("en-GB")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Claim Items Table */}
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
                    {claim.status === "DRAFT" && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">
                        Inc.
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Donor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Postcode
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Gift Aid
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {claim.items.map((item) => (
                    <tr
                      key={item.id}
                      className={
                        item.status === "ERROR"
                          ? "bg-red-50"
                          : item.status === "EXCLUDED"
                          ? "bg-gray-50 opacity-60"
                          : "hover:bg-gray-50"
                      }
                    >
                      {claim.status === "DRAFT" && (
                        <td className="px-4 py-3">
                          {item.status !== "ERROR" && (
                            <form action={toggleClaimItem} className="inline">
                              <input type="hidden" name="itemId" value={item.id} />
                              <input type="hidden" name="claimId" value={claim.id} />
                              <button type="submit">
                                <input
                                  type="checkbox"
                                  checked={item.status === "INCLUDED"}
                                  readOnly
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                                />
                              </button>
                            </form>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.donorName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.donorPostcode || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(item.donationDate)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.donationAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-indigo-600 text-right">
                        {item.status === "INCLUDED"
                          ? formatCurrency(item.giftAidAmount)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
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
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                    <td
                      colSpan={claim.status === "DRAFT" ? 5 : 4}
                      className="px-4 py-3 text-sm text-gray-700"
                    >
                      Totals ({includedItems.length} included)
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-indigo-600">
                      {formatCurrency(claim.totalClaimable)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Trail */}
      {allAuditLogs.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h2>
            <div className="space-y-3">
              {allAuditLogs.map((log) => {
                let details: Record<string, unknown> = {};
                try {
                  if (log.details) details = JSON.parse(log.details);
                } catch {
                  // ignore parse errors
                }
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-900">
                          {log.user?.name || "System"}
                        </span>
                        <Badge className="bg-gray-100 text-gray-600 text-xs">
                          {log.action}
                        </Badge>
                        <span className="text-gray-400 text-xs">
                          {log.entityType}
                        </span>
                      </div>
                      {Object.keys(details).length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {Object.entries(details)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(log.createdAt).toLocaleString("en-GB")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
