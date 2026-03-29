import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Landmark, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function GrantsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const statusFilter = params.status || "";

  const grants = await prisma.grant.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { funderName: { contains: search, mode: "insensitive" } },
                { reference: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        statusFilter ? { status: statusFilter } : {},
      ],
    },
    include: {
      createdBy: true,
      funder: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Calculate statistics
  const awardedGrants = grants.filter((g) => g.status === "SUCCESSFUL" || g.status === "REPORTING" || g.status === "COMPLETED");
  const activeGrants = grants.filter((g) => g.status === "REPORTING");
  const pipelineGrants = grants.filter((g) => g.status === "IDENTIFIED" || g.status === "RESEARCHING" || g.status === "APPLYING" || g.status === "SUBMITTED");

  const totalValue = awardedGrants.reduce((sum, g) => sum + (g.amountAwarded || 0), 0);
  const successRate = grants.length > 0 ? ((awardedGrants.length / grants.length) * 100).toFixed(1) : "0";

  const statusColors: Record<string, string> = {
    IDENTIFIED: "bg-blue-100 text-blue-800",
    RESEARCHING: "bg-blue-100 text-blue-800",
    APPLYING: "bg-yellow-100 text-yellow-800",
    SUBMITTED: "bg-yellow-100 text-yellow-800",
    SUCCESSFUL: "bg-purple-100 text-purple-800",
    UNSUCCESSFUL: "bg-red-100 text-red-800",
    REPORTING: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grants</h1>
          <p className="text-gray-500 mt-1">Track and manage grant applications</p>
        </div>
        <Link href="/finance/grants/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Grant
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            £{totalValue.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Grants</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{activeGrants.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pipeline</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{pipelineGrants.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{successRate}%</p>
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
              placeholder="Search by title, funder, or reference..."
              className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
            />
          </div>
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="IDENTIFIED">Identified</option>
            <option value="RESEARCHING">Researching</option>
            <option value="APPLYING">Applying</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="SUCCESSFUL">Successful</option>
            <option value="UNSUCCESSFUL">Unsuccessful</option>
            <option value="REPORTING">Reporting</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
      </Card>

      {/* Grants table */}
      {grants.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No grants found"
          description="Get started by creating your first grant record."
          actionLabel="New Grant"
          actionHref="/finance/grants/new"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Funder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {grants.map((grant) => (
                  <tr key={grant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <Link
                        href={`/finance/grants/${grant.id}`}
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        {grant.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{grant.funderName}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {grant.amountAwarded ? (
                        `£${grant.amountAwarded.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
                      ) : grant.amountRequested ? (
                        `£${grant.amountRequested.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[grant.status] || ""}>{grant.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {grant.submittedDate ? formatDate(grant.submittedDate) : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {grant.endDate ? formatDate(grant.endDate) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/finance/grants/${grant.id}`}
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
