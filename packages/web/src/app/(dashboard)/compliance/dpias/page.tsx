import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function DpiasPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const statusFilter = params.status || "";

  const dpias = await prisma.dpia.findMany({
    where: {
      AND: [
        search ? { title: { contains: search } } : {},
        statusFilter ? { status: statusFilter } : {},
      ],
    },
    include: {
      createdBy: true,
      risks: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    IN_REVIEW: "bg-blue-100 text-blue-800",
    DPO_REVIEW: "bg-indigo-100 text-indigo-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    REQUIRES_UPDATE: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Data Protection Impact Assessments
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your DPIAs and associated risks
          </p>
        </div>
        <Link href="/compliance/dpias/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New DPIA
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
            <option value="DRAFT">Draft</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DPO_REVIEW">DPO Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="REQUIRES_UPDATE">Requires Update</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
      </Card>

      {/* DPIA list */}
      {dpias.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No DPIAs found"
          description="Get started by creating your first Data Protection Impact Assessment."
          actionLabel="Create DPIA"
          actionHref="/compliance/dpias/new"
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
                    Project/System
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Legal Basis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Special Categories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DPO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CSO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dpias.map((dpia) => (
                  <tr
                    key={dpia.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/compliance/dpias/${dpia.id}`}
                        className="text-sm font-medium text-indigo-600 hover:underline"
                      >
                        {dpia.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {dpia.projectOrSystem}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {dpia.legalBasis || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {dpia.specialCategories ? (
                        <Badge className="bg-red-100 text-red-800">Yes</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">No</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {dpia.dpoSignedOff ? (
                        <CheckCircle className="h-5 w-5 text-green-600 inline" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300 inline" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {dpia.csoSignedOff ? (
                        <CheckCircle className="h-5 w-5 text-green-600 inline" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300 inline" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {dpia.reviewDate ? formatDate(dpia.reviewDate) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[dpia.status] || ""}>
                        {dpia.status}
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
