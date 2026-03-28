import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function RopaPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; legalBasis?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const legalBasisFilter = params.legalBasis || "";

  const activities = await prisma.processingActivity.findMany({
    where: {
      AND: [
        search ? { name: { contains: search, mode: "insensitive" } } : {},
        legalBasisFilter ? { legalBasis: legalBasisFilter } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const legalBasisColors: Record<string, string> = {
    CONSENT: "bg-blue-100 text-blue-800",
    PUBLIC_TASK: "bg-green-100 text-green-800",
    LEGITIMATE_INTEREST: "bg-purple-100 text-purple-800",
    LEGAL_OBLIGATION: "bg-red-100 text-red-800",
    VITAL_INTEREST: "bg-orange-100 text-orange-800",
    CONTRACT: "bg-indigo-100 text-indigo-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Record of Processing Activities</h1>
          <p className="text-gray-500 mt-1">GDPR Article 30 - Document all processing activities</p>
        </div>
        <Link href="/compliance/ropa/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
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
            name="legalBasis"
            defaultValue={legalBasisFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Legal Bases</option>
            <option value="CONSENT">Consent</option>
            <option value="PUBLIC_TASK">Public Task</option>
            <option value="LEGITIMATE_INTEREST">Legitimate Interest</option>
            <option value="LEGAL_OBLIGATION">Legal Obligation</option>
            <option value="VITAL_INTEREST">Vital Interest</option>
            <option value="CONTRACT">Contract</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
      </Card>

      {/* Activity list */}
      {activities.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No processing activities"
          description="Document your data processing activities to maintain GDPR compliance."
          actionLabel="Add Activity"
          actionHref="/compliance/ropa/new"
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
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Legal Basis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Subjects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DPA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Review
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/compliance/ropa/${activity.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {activity.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {activity.purpose}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={legalBasisColors[activity.legalBasis] || ""}>
                        {activity.legalBasis.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {activity.dataSubjectCategories}
                    </td>
                    <td className="px-6 py-4">
                      {activity.dpaInPlace ? (
                        <span className="text-green-600 font-semibold">✓</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={activity.isActive ? "default" : "outline"}>
                        {activity.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {activity.lastReviewDate
                        ? new Date(activity.lastReviewDate).toLocaleDateString()
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
