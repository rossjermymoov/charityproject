import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, Package, MapPin, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function CollectionTinsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const statusFilter = params.status || "";

  const tins = await prisma.collectionTin.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { tinNumber: { contains: search, mode: "insensitive" } },
                { locationName: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        statusFilter ? { status: statusFilter } : {},
      ],
    },
    include: {
      createdBy: true,
      location: true,
      movements: {
        where: { type: "COUNTED", amount: { not: null } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const statusColors: Record<string, string> = {
    IN_STOCK: "bg-blue-100 text-blue-800",
    DEPLOYED: "bg-green-100 text-green-800",
    RETURNED: "bg-purple-100 text-purple-800",
    LOST: "bg-red-100 text-red-800",
    STOLEN: "bg-red-100 text-red-800",
    RETIRED: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collection Tins</h1>
          <p className="text-gray-500 mt-1">Manage collection tins and track deployments</p>
        </div>
        <div className="flex gap-2">
          <Link href="/finance/collection-tins/locations">
            <Button variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Locations
            </Button>
          </Link>
          <Link href="/finance/collection-tins/reports">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </Link>
          <Link href="/finance/collection-tins/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tin
            </Button>
          </Link>
        </div>
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
              placeholder="Search by tin number or location..."
              className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
            />
          </div>
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="DEPLOYED">Deployed</option>
            <option value="RETURNED">Returned</option>
            <option value="LOST">Lost</option>
            <option value="STOLEN">Stolen</option>
            <option value="RETIRED">Retired</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
      </Card>

      {/* Tin list */}
      {tins.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No collection tins found"
          description="Get started by adding your first collection tin."
          actionLabel="Add Tin"
          actionHref="/finance/collection-tins/new"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tin Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Collected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deployed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tins.map((tin) => {
                  const totalCollected = tin.movements.reduce(
                    (s, m) => s + (m.amount || 0),
                    0
                  );
                  return (
                    <tr key={tin.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/finance/collection-tins/${tin.id}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {tin.tinNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          {tin.location ? (
                            <Link
                              href={`/finance/collection-tins/locations/${tin.location.id}`}
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              {tin.location.name}
                            </Link>
                          ) : (
                            <p className="text-sm font-medium text-gray-900">
                              {tin.locationName}
                            </p>
                          )}
                          {(tin.location?.address || tin.locationAddress) && (
                            <p className="text-xs text-gray-500">
                              {tin.location?.address || tin.locationAddress}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={statusColors[tin.status] || ""}>
                          {tin.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        {totalCollected > 0
                          ? `£${totalCollected.toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {tin.deployedAt ? formatDate(tin.deployedAt) : "—"}
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
