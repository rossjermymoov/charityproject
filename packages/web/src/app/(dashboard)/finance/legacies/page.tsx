import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Heart, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function LegaciesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const statusFilter = params.status || "";

  const legacies = await prisma.legacy.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { deceasedName: { contains: search, mode: "insensitive" } },
                { solicitorName: { contains: search, mode: "insensitive" } },
                { solicitorFirm: { contains: search, mode: "insensitive" } },
                { contact: { firstName: { contains: search, mode: "insensitive" } } },
                { contact: { lastName: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {},
        statusFilter ? { status: statusFilter } : {},
      ],
    },
    include: {
      contact: true,
      createdBy: true,
    },
    orderBy: { dateNotified: "desc" },
    take: 100,
  });

  // Calculate statistics
  const totalEstimated = legacies.reduce((sum, l) => sum + (l.estimatedAmount || 0), 0);
  const totalReceived = legacies.reduce((sum, l) => sum + (l.receivedAmount || 0), 0);
  const inAdministration = legacies.filter((l) => l.status === "INVESTIGATING" || l.status === "PROBATE" || l.status === "AWAITING_PAYMENT").length;
  const notified = legacies.filter((l) => l.status === "NOTIFIED").length;

  const statusColors: Record<string, string> = {
    NOTIFIED: "bg-blue-100 text-blue-800",
    INVESTIGATING: "bg-yellow-100 text-yellow-800",
    PROBATE: "bg-yellow-100 text-yellow-800",
    AWAITING_PAYMENT: "bg-orange-100 text-orange-800",
    RECEIVED: "bg-green-100 text-green-800",
    PARTIAL: "bg-purple-100 text-purple-800",
    DISPUTED: "bg-red-100 text-red-800",
    CLOSED: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Legacies</h1>
          <p className="text-gray-500 mt-1">Track and manage legacy gifts</p>
        </div>
        <Link href="/finance/legacies/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Legacy
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Estimated</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            £{totalEstimated.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Received</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            £{totalReceived.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">In Administration</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{inAdministration}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notified</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{notified}</p>
        </Card>
      </div>

      {/* Search and filters */}
      <Card className="p-4">
        <form className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              name="search"
              type="text"
              defaultValue={search}
              placeholder="Search by name, solicitor, or firm..."
              className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
            />
          </div>
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="NOTIFIED">Notified</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="PROBATE">Probate</option>
            <option value="AWAITING_PAYMENT">Awaiting Payment</option>
            <option value="RECEIVED">Received</option>
            <option value="PARTIAL">Partial</option>
            <option value="DISPUTED">Disputed</option>
            <option value="CLOSED">Closed</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
      </Card>

      {/* Legacies table */}
      {legacies.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No legacies found"
          description="Get started by recording your first legacy gift."
          actionLabel="New Legacy"
          actionHref="/finance/legacies/new"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deceased Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Received
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notified Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solicitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {legacies.map((legacy) => (
                  <tr key={legacy.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <Link
                        href={`/finance/legacies/${legacy.id}`}
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        {legacy.deceasedName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {legacy.contact
                        ? `${legacy.contact.firstName} ${legacy.contact.lastName}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[legacy.status] || ""}>{legacy.status}</Badge>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {legacy.estimatedAmount
                        ? `£${legacy.estimatedAmount.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {legacy.receivedAmount
                        ? `£${legacy.receivedAmount.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(legacy.dateNotified)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {legacy.solicitorName ? legacy.solicitorName : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/finance/legacies/${legacy.id}`}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        View
                      </Link>
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
