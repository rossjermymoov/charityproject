import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AlertTriangle, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function BreachesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; severity?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const statusFilter = params.status || "";
  const severityFilter = params.severity || "";

  const breaches = await prisma.dataBreach.findMany({
    where: {
      AND: [
        search ? { title: { contains: search, mode: "insensitive" } } : {},
        statusFilter ? { status: statusFilter } : {},
        severityFilter ? { severity: severityFilter } : {},
      ],
    },
    include: {
      createdBy: true,
    },
    orderBy: { discoveredAt: "desc" },
    take: 50,
  });

  // Check for breaches requiring ICO notification
  const now = new Date();
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const breachesNeedingNotification = breaches.filter(
    (b) => b.status === "OPEN" && b.discoveredAt < seventyTwoHoursAgo && !b.icoNotified
  );

  const severityColors: Record<string, string> = {
    LOW: "bg-green-100 text-green-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
  };

  const statusColors: Record<string, string> = {
    OPEN: "bg-red-100 text-red-800",
    CONTAINED: "bg-orange-100 text-orange-800",
    INVESTIGATING: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Breach Log</h1>
          <p className="text-gray-500 mt-1">Manage and track data breaches and security incidents</p>
        </div>
        <Link href="/dashboard/compliance/breaches/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Report Breach
          </Button>
        </Link>
      </div>

      {/* Alert banner for overdue ICO notifications */}
      {breachesNeedingNotification.length > 0 && (
        <Card className="border-l-4 border-red-500 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">
                {breachesNeedingNotification.length} breach{breachesNeedingNotification.length !== 1 ? "es" : ""} requires ICO notification
              </h3>
              <p className="text-sm text-red-700 mt-1">
                72-hour deadline for ICO notification has passed. Please notify the ICO immediately.
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
              placeholder="Search by title..."
              className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
            />
          </div>
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="CONTAINED">Contained</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            name="severity"
            defaultValue={severityFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
      </Card>

      {/* Breaches table */}
      {breaches.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No breaches found"
          description="No data breaches match your search criteria."
          actionLabel="Report Breach"
          actionHref="/dashboard/compliance/breaches/new"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discovered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ICO Notified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Subjects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {breaches.map((breach) => (
                  <tr key={breach.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/compliance/breaches/${breach.id}`}
                        className="text-sm font-medium text-indigo-600 hover:underline"
                      >
                        {breach.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(breach.discoveredAt)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={severityColors[breach.severity] || "bg-gray-100 text-gray-800"}>
                        {breach.severity}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {breach.icoNotified ? "✓ Yes" : "✗ No"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {breach.dataSubjectsAffected || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[breach.status] || "bg-gray-100 text-gray-800"}>
                        {breach.status}
                      </Badge>
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
