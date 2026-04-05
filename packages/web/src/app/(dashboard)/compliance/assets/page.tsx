import { formatDate, formatShortDate } from '@/lib/utils';
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Database, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; assetType?: string; riskLevel?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const assetTypeFilter = params.assetType || "";
  const riskLevelFilter = params.riskLevel || "";

  const assets = await prisma.informationAsset.findMany({
    where: {
      AND: [
        search ? { name: { contains: search, mode: "insensitive" } } : {},
        assetTypeFilter ? { assetType: assetTypeFilter } : {},
        riskLevelFilter ? { riskLevel: riskLevelFilter } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const assetTypeColors: Record<string, string> = {
    DATABASE: "bg-blue-100 text-blue-800",
    FILE_SYSTEM: "bg-yellow-100 text-yellow-800",
    CLOUD_SERVICE: "bg-purple-100 text-purple-800",
    PAPER: "bg-gray-100 text-gray-800",
    APPLICATION: "bg-green-100 text-green-800",
    EMAIL: "bg-indigo-100 text-indigo-800",
  };

  const classificationColors: Record<string, string> = {
    OFFICIAL: "bg-gray-100 text-gray-800",
    OFFICIAL_SENSITIVE: "bg-orange-100 text-orange-800",
    SECRET: "bg-red-100 text-red-800",
  };

  const riskColors: Record<string, string> = {
    LOW: "bg-green-100 text-green-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Information Asset Register</h1>
          <p className="text-gray-500 mt-1">Inventory and control of information assets</p>
        </div>
        <Link href="/compliance/assets/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
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
              placeholder="Search by name..."
              className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
            />
          </div>
          <select
            name="assetType"
            defaultValue={assetTypeFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="DATABASE">Database</option>
            <option value="FILE_SYSTEM">File System</option>
            <option value="CLOUD_SERVICE">Cloud Service</option>
            <option value="PAPER">Paper</option>
            <option value="APPLICATION">Application</option>
            <option value="EMAIL">Email</option>
          </select>
          <select
            name="riskLevel"
            defaultValue={riskLevelFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Risk Levels</option>
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

      {/* Asset list */}
      {assets.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No information assets"
          description="Create an information asset register to document and control your data assets."
          actionLabel="Add Asset"
          actionHref="/compliance/assets/new"
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
                    Classification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personal Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Special Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Encryption
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Review
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/compliance/assets/${asset.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {asset.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={assetTypeColors[asset.assetType] || ""}>
                        {asset.assetType.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={classificationColors[asset.dataClassification] || ""}>
                        {asset.dataClassification.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {asset.personalData ? (
                        <span className="text-sm text-gray-700">Yes</span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {asset.specialCategoryData ? (
                        <span className="text-sm text-gray-700">Yes</span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {asset.encryptionAtRest && <span className="text-green-600 text-sm">Rest✓</span>}
                        {asset.encryptionInTransit && <span className="text-green-600 text-sm">Transit✓</span>}
                        {!asset.encryptionAtRest && !asset.encryptionInTransit && (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={riskColors[asset.riskLevel] || ""}>
                        {asset.riskLevel}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {asset.lastReviewDate
                        ? formatDate(asset.lastReviewDate)
                        : "—"}
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
