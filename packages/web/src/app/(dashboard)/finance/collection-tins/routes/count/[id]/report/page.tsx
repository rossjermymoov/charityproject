import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteInfographic } from "./infographic";

export default async function RouteReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const route = await prisma.collectionRoute.findUnique({
    where: { id },
    include: {
      stops: {
        include: {
          location: true,
          collectedTin: true,
          deployedTin: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      assignedTo: { include: { contact: true } },
      createdBy: true,
      tinReturns: {
        include: { tin: true, countedBy: true },
        orderBy: { returnedAt: "asc" },
      },
    },
  });

  if (!route) notFound();

  // Compute stats
  const completedStops = route.stops.filter((s) => s.status === "COMPLETED");
  const skippedStops = route.stops.filter((s) => s.status === "SKIPPED");
  const amounts = route.tinReturns.map((r) => r.amount);
  const totalCollected = amounts.reduce((a, b) => a + b, 0);
  const avgPerTin = amounts.length > 0 ? totalCollected / amounts.length : 0;
  const highestTin = route.tinReturns.reduce(
    (best, r) =>
      r.amount > (best?.amount || 0) ? r : best,
    null as (typeof route.tinReturns)[0] | null
  );
  const lowestTin =
    amounts.length > 0
      ? route.tinReturns.reduce(
          (worst, r) => (r.amount < worst.amount ? r : worst),
          route.tinReturns[0]
        )
      : null;

  // Time stats
  const durationMs =
    route.startedAt && route.completedAt
      ? route.completedAt.getTime() - route.startedAt.getTime()
      : null;
  const durationHours = durationMs ? durationMs / (1000 * 60 * 60) : null;

  // Location type breakdown
  const typeBreakdown: Record<string, { count: number; total: number }> = {};
  for (const stop of completedStops) {
    const locType = stop.location.type || "OTHER";
    if (!typeBreakdown[locType]) typeBreakdown[locType] = { count: 0, total: 0 };
    typeBreakdown[locType].count++;
    const tinReturn = route.tinReturns.find(
      (r) => r.tinId === stop.collectedTin?.id
    );
    if (tinReturn) typeBreakdown[locType].total += tinReturn.amount;
  }

  // Amount distribution for chart
  const distribution = amounts.map((a, i) => ({
    stopNumber: i + 1,
    amount: a,
    tinNumber: route.tinReturns[i]?.tin.tinNumber || "",
    location:
      completedStops[i]?.location.name ||
      route.tinReturns[i]?.tin.locationName ||
      "",
  }));

  // Top 5 earners
  const topEarners = [...route.tinReturns]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((r) => {
      const stop = completedStops.find((s) => s.collectedTin?.id === r.tinId);
      return {
        tinNumber: r.tin.tinNumber,
        amount: r.amount,
        location: stop?.location.name || r.tin.locationName,
        type: stop?.location.type || "OTHER",
      };
    });

  const stats = {
    routeName: route.name,
    routeDescription: route.description,
    completedDate: route.completedAt?.toISOString() || null,
    startedDate: route.startedAt?.toISOString() || null,
    volunteer: route.assignedTo
      ? `${route.assignedTo.contact.firstName} ${route.assignedTo.contact.lastName}`
      : null,
    totalStops: route.stops.length,
    completedStops: completedStops.length,
    skippedStops: skippedStops.length,
    totalTinsCounted: amounts.length,
    totalCollected,
    avgPerTin: Math.round(avgPerTin * 100) / 100,
    highestAmount: highestTin?.amount || 0,
    highestTinNumber: highestTin?.tin.tinNumber || "",
    lowestAmount: lowestTin?.amount || 0,
    lowestTinNumber: lowestTin?.tin.tinNumber || "",
    durationHours: durationHours ? Math.round(durationHours * 10) / 10 : null,
    typeBreakdown: Object.entries(typeBreakdown).map(([type, data]) => ({
      type,
      count: data.count,
      total: Math.round(data.total * 100) / 100,
      avg: Math.round((data.total / data.count) * 100) / 100,
    })),
    distribution,
    topEarners,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/finance/collection-tins/routes/count/${route.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Count
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Route Report</h1>
            <p className="text-gray-500 mt-1">{route.name}</p>
          </div>
        </div>
      </div>

      <RouteInfographic stats={stats} />
    </div>
  );
}
