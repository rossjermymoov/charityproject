import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AlertTriangle, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ClinicalSafetyPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; acceptability?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const statusFilter = params.status || "";
  const acceptabilityFilter = params.acceptability || "";

  const hazards = await prisma.clinicalHazard.findMany({
    where: {
      AND: [
        search ? { name: { contains: search, mode: "insensitive" } } : {},
        statusFilter ? { status: statusFilter } : {},
        acceptabilityFilter ? { riskAcceptability: acceptabilityFilter } : {},
      ],
    },
    orderBy: { hazardNumber: "asc" },
  });

  const riskLevelColors: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-800",
    HIGH: "bg-orange-100 text-orange-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    LOW: "bg-green-100 text-green-800",
  };

  const acceptabilityColors: Record<string, string> = {
    ACCEPTABLE: "bg-green-100 text-green-800",
    TOLERABLE: "bg-yellow-100 text-yellow-800",
    UNACCEPTABLE: "bg-red-100 text-red-800",
  };

  const statusColors: Record<string, string> = {
    OPEN: "bg-red-100 text-red-800",
    MITIGATED: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-green-100 text-green-800",
    TRANSFERRED: "bg-blue-100 text-blue-800",
  };

  const hasUnacceptableOpen = hazards.some(
    (h) => h.riskAcceptability === "UNACCEPTABLE" && h.status === "OPEN"
  );

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      {hasUnacceptableOpen && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                UNACCEPTABLE RISKS IDENTIFIED
              </h3>
              <p className="text-sm text-red-700 mt-1">
                There are open hazards with unacceptable risk levels. These must be addressed
                immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinical Safety Hazard Log</h1>
          <p className="text-gray-500 mt-1">DCB0129/DCB0160 - Medical device hazard management</p>
        </div>
        <Link href="/compliance/clinical-safety/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Hazard
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
            name="status"
            defaultValue={statusFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="MITIGATED">Mitigated</option>
            <option value="CLOSED">Closed</option>
            <option value="TRANSFERRED">Transferred</option>
          </select>
          <select
            name="acceptability"
            defaultValue={acceptabilityFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Risk Levels</option>
            <option value="ACCEPTABLE">Acceptable</option>
            <option value="TOLERABLE">Tolerable</option>
            <option value="UNACCEPTABLE">Unacceptable</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
      </Card>

      {/* Hazard list */}
      {hazards.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No hazards"
          description="Create a hazard log to document and manage clinical safety risks."
          actionLabel="Add Hazard"
          actionHref="/compliance/clinical-safety/new"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hazard #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Initial Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Residual Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acceptability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CSO Signed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {hazards.map((hazard) => (
                  <tr key={hazard.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/compliance/clinical-safety/${hazard.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {hazard.hazardNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/compliance/clinical-safety/${hazard.id}`}
                        className="text-sm text-gray-900 hover:text-indigo-700"
                      >
                        {hazard.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={riskLevelColors[hazard.initialRiskLevel] || ""}>
                        {hazard.initialRiskLevel}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {hazard.residualRiskLevel ? (
                        <Badge className={riskLevelColors[hazard.residualRiskLevel] || ""}>
                          {hazard.residualRiskLevel}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={acceptabilityColors[hazard.riskAcceptability] || ""}>
                        {hazard.riskAcceptability}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {hazard.csoSignedOff ? (
                        <span className="text-green-600 font-semibold">✓</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[hazard.status] || ""}>
                        {hazard.status}
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
