import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Heart, Plus, Search, TrendingUp, Banknote, Clock, PiggyBank, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { PipelineTimeline, getLegacySteps } from "@/components/ui/pipeline-timeline";

export default async function LegaciesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; year?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const statusFilter = params.status || "";
  const yearFilter = params.year || "";

  const currentYear = new Date().getFullYear();

  // Build date filter
  let dateFilter = {};
  if (yearFilter) {
    const y = parseInt(yearFilter);
    dateFilter = {
      dateNotified: {
        gte: new Date(`${y}-01-01`),
        lt: new Date(`${y + 1}-01-01`),
      },
    };
  }

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
        dateFilter,
      ],
    },
    include: {
      contact: true,
      createdBy: true,
    },
    orderBy: { dateNotified: "desc" },
    take: 200,
  });

  // Fetch all legacies for historic analysis
  const allLegacies = await prisma.legacy.findMany({
    select: {
      status: true,
      estimatedAmount: true,
      receivedAmount: true,
      dateNotified: true,
      dateReceived: true,
      createdAt: true,
    },
  });

  // Year options from data
  const yearsSet = new Set<number>();
  allLegacies.forEach((l) => {
    yearsSet.add(l.dateNotified.getFullYear());
    if (l.dateReceived) yearsSet.add(l.dateReceived.getFullYear());
  });
  yearsSet.add(currentYear);
  yearsSet.add(currentYear - 1);
  yearsSet.add(currentYear - 2);
  const years = Array.from(yearsSet).sort((a, b) => b - a);

  // Current filtered view stats
  const totalEstimated = legacies.reduce((sum, l) => sum + (l.estimatedAmount || 0), 0);
  const totalReceived = legacies.reduce((sum, l) => sum + (l.receivedAmount || 0), 0);
  const inAdministration = legacies.filter((l) =>
    ["INVESTIGATING", "PROBATE", "AWAITING_PAYMENT"].includes(l.status)
  ).length;
  const notified = legacies.filter((l) => l.status === "NOTIFIED").length;

  // Historic year-over-year
  const buildYearStats = (y: number) => {
    const yearLegacies = allLegacies.filter((l) => l.dateNotified.getFullYear() === y);
    const received = allLegacies.filter(
      (l) => l.dateReceived && l.dateReceived.getFullYear() === y
    );
    return {
      notified: yearLegacies.length,
      estimatedValue: yearLegacies.reduce((s, l) => s + (l.estimatedAmount || 0), 0),
      receivedCount: received.length,
      receivedValue: received.reduce((s, l) => s + (l.receivedAmount || 0), 0),
    };
  };

  const thisYear = buildYearStats(currentYear);
  const lastYear = buildYearStats(currentYear - 1);
  const twoYearsAgo = buildYearStats(currentYear - 2);

  // Forecast: pipeline value (legacies not yet received)
  const pipelineValue = allLegacies
    .filter((l) => ["NOTIFIED", "INVESTIGATING", "PROBATE", "AWAITING_PAYMENT"].includes(l.status))
    .reduce((s, l) => s + (l.estimatedAmount || 0), 0);

  // Average time to receipt (for legacies that have been received)
  const completedLegacies = allLegacies.filter((l) => l.dateReceived && l.status === "RECEIVED");
  const avgMonths = completedLegacies.length > 0
    ? Math.round(
        completedLegacies.reduce((sum, l) => {
          const notified = l.dateNotified.getTime();
          const received = l.dateReceived!.getTime();
          return sum + (received - notified) / (1000 * 60 * 60 * 24 * 30);
        }, 0) / completedLegacies.length
      )
    : null;

  const yoyChange = lastYear.receivedValue > 0
    ? (((thisYear.receivedValue - lastYear.receivedValue) / lastYear.receivedValue) * 100).toFixed(0)
    : null;

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

  const fmt = (n: number) => `£${n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Legacies</h1>
          <p className="text-gray-500 mt-1">Track and manage legacy gifts and bequests</p>
        </div>
        <Link href="/finance/legacies/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Legacy
          </Button>
        </Link>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Banknote className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Total Received</p>
              <p className="text-lg font-bold text-gray-900">{fmt(totalReceived)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <PiggyBank className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Pipeline Forecast</p>
              <p className="text-lg font-bold text-gray-900">{fmt(pipelineValue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">In Administration</p>
              <p className="text-lg font-bold text-gray-900">{inAdministration}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Heart className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Newly Notified</p>
              <p className="text-lg font-bold text-gray-900">{notified}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{currentYear} vs {currentYear - 1}</p>
              <p className="text-lg font-bold text-gray-900">
                {fmt(thisYear.receivedValue)}
                {yoyChange && (
                  <span className={`text-xs ml-1 ${parseInt(yoyChange) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {parseInt(yoyChange) >= 0 ? "+" : ""}{yoyChange}%
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Historic Year Comparison & Forecast */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Year-on-Year Analysis & Forecast</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Notified</th>
                  <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Est. Value</th>
                  <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Received</th>
                  <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Received Value</th>
                  <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase pl-4">Comparison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { year: currentYear, stats: thisYear, label: `${currentYear} (YTD)` },
                  { year: currentYear - 1, stats: lastYear, label: `${currentYear - 1}` },
                  { year: currentYear - 2, stats: twoYearsAgo, label: `${currentYear - 2}` },
                ].map((row) => (
                  <tr key={row.year} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{row.label}</td>
                    <td className="py-3 text-right text-gray-700">{row.stats.notified}</td>
                    <td className="py-3 text-right text-gray-700">{fmt(row.stats.estimatedValue)}</td>
                    <td className="py-3 text-right text-gray-700">{row.stats.receivedCount}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{fmt(row.stats.receivedValue)}</td>
                    <td className="py-3 pl-4">
                      {row.stats.receivedValue > 0 && (
                        <div className="w-full bg-gray-100 rounded-full h-3 max-w-[120px]">
                          <div
                            className="bg-indigo-500 h-3 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                (row.stats.receivedValue /
                                  Math.max(
                                    thisYear.receivedValue,
                                    lastYear.receivedValue,
                                    twoYearsAgo.receivedValue,
                                    1
                                  )) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Forecast row */}
                <tr className="bg-indigo-50/50">
                  <td className="py-3 font-medium text-indigo-700">
                    Forecast Pipeline
                  </td>
                  <td className="py-3 text-right text-indigo-600">—</td>
                  <td className="py-3 text-right font-semibold text-indigo-700">{fmt(pipelineValue)}</td>
                  <td className="py-3 text-right text-indigo-600">—</td>
                  <td className="py-3 text-right text-indigo-600">—</td>
                  <td className="py-3 pl-4 text-xs text-indigo-500">
                    {avgMonths
                      ? `Avg. ${avgMonths} months to receipt`
                      : "No receipt data yet"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
          <select
            name="year"
            defaultValue={yearFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
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
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notified
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
                      {legacy.contact && (
                        <p className="text-xs text-gray-500">
                          Contact: {legacy.contact.firstName} {legacy.contact.lastName}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {legacy.estimatedAmount ? fmt(legacy.estimatedAmount) : "—"}
                      </div>
                      {legacy.receivedAmount ? (
                        <div className="text-xs text-green-600">
                          Received: {fmt(legacy.receivedAmount)}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <PipelineTimeline
                        steps={getLegacySteps(legacy)}
                        currentStepKey={
                          legacy.status === "DISPUTED" || legacy.status === "PARTIAL"
                            ? "AWAITING_PAYMENT"
                            : legacy.status
                        }
                        variant="legacy"
                        size="compact"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[legacy.status] || ""}>{legacy.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(legacy.dateNotified)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {legacy.solicitorName || "—"}
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
