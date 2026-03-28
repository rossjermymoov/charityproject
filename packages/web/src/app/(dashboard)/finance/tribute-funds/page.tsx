import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function TributeFundsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const typeFilter = params.type || "";
  const statusFilter = params.status || "";

  const funds = await prisma.tributeFund.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search } },
                { inMemoryOf: { contains: search } },
              ],
            }
          : {},
        typeFilter ? { type: typeFilter } : {},
        statusFilter ? { status: statusFilter } : {},
      ],
    },
    include: {
      guardians: { include: { contact: true } },
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const typeColors: Record<string, string> = {
    TRADITIONAL: "bg-blue-100 text-blue-800",
    ROBIN: "bg-pink-100 text-pink-800",
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tribute Funds</h1>
          <p className="text-gray-500 mt-1">Manage tribute and memorial funds</p>
        </div>
        <Link href="/dashboard/finance/tribute-funds/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Fund
          </Button>
        </Link>
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
              placeholder="Search by name or in memory of..."
              className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
            />
          </div>
          <select
            name="type"
            defaultValue={typeFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="TRADITIONAL">Traditional</option>
            <option value="ROBIN">Robin</option>
          </select>
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
      </Card>

      {/* Fund list */}
      {funds.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No tribute funds found"
          description="Get started by creating your first tribute fund."
          actionLabel="New Fund"
          actionHref="/dashboard/finance/tribute-funds/new"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    In Memory Of
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Raised
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guardians
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {funds.map((fund) => (
                  <tr key={fund.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/finance/tribute-funds/${fund.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {fund.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={typeColors[fund.type]}>{fund.type}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {fund.inMemoryOf || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      £{fund.totalRaised.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {fund.guardians.length} {fund.guardians.length === 1 ? "guardian" : "guardians"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[fund.status]}>{fund.status}</Badge>
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
