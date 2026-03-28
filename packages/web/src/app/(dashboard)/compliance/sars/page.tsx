import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileText, Plus, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function SARsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const statusFilter = params.status || "";

  const sars = await prisma.subjectAccessRequest.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { requesterName: { contains: search, mode: "insensitive" } },
                { requesterEmail: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        statusFilter ? { status: statusFilter } : {},
      ],
    },
    include: {
      assignedTo: true,
    },
    orderBy: { requestDate: "desc" },
    take: 50,
  });

  // Count past-due SARs
  const now = new Date();
  const pastDueSARs = sars.filter((sar) => sar.dueDate < now && sar.status !== "SENT" && sar.status !== "CLOSED" && sar.status !== "REFUSED");

  const statusColors: Record<string, string> = {
    RECEIVED: "bg-blue-100 text-blue-800",
    VERIFIED: "bg-indigo-100 text-indigo-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    READY: "bg-orange-100 text-orange-800",
    SENT: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-800",
    REFUSED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subject Access Requests</h1>
          <p className="text-gray-500 mt-1">Manage data subject access requests (GDPR)</p>
        </div>
        <Link href="/dashboard/compliance/sars/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New SAR
          </Button>
        </Link>
      </div>

      {/* Alert for past-due SARs */}
      {pastDueSARs.length > 0 && (
        <Card className="border-l-4 border-orange-500 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900">
                {pastDueSARs.length} SAR{pastDueSARs.length !== 1 ? "s" : ""} past due
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                You must respond to Subject Access Requests within 1 calendar month of receipt.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Search and filters */}
      <Card className="p-4">
        <form className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              name="search"
              type="text"
              defaultValue={search}
              placeholder="Search by requester name or email..."
              className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
            />
          </div>
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="RECEIVED">Received</option>
            <option value="VERIFIED">Verified</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="READY">Ready</option>
            <option value="SENT">Sent</option>
            <option value="CLOSED">Closed</option>
            <option value="REFUSED">Refused</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
      </Card>

      {/* SARs table */}
      {sars.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No SARs found"
          description="No subject access requests match your search criteria."
          actionLabel="Create SAR"
          actionHref="/dashboard/compliance/sars/new"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Verified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sars.map((sar) => {
                  const isPastDue = sar.dueDate < now && sar.status !== "SENT" && sar.status !== "CLOSED" && sar.status !== "REFUSED";
                  return (
                    <tr key={sar.id} className={`hover:bg-gray-50 transition-colors ${isPastDue ? "bg-orange-50" : ""}`}>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/compliance/sars/${sar.id}`}
                          className="text-sm font-medium text-indigo-600 hover:underline"
                        >
                          {sar.requesterName}
                        </Link>
                        {sar.requesterEmail && (
                          <p className="text-xs text-gray-500">{sar.requesterEmail}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(sar.requestDate)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={isPastDue ? "font-semibold text-red-600" : "text-gray-600"}>
                          {formatDate(sar.dueDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {sar.idVerified ? "✓ Yes" : "✗ No"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {sar.assignedTo?.name || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={statusColors[sar.status] || "bg-gray-100 text-gray-800"}>
                          {sar.status}
                        </Badge>
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
