import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Route,
  MapPin,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function MyRoutesPage() {
  // Only fetch MANUAL routes (not SUGGESTED)
  const routes = await prisma.collectionRoute.findMany({
    where: {
      isActive: true,
      source: "MANUAL",
    },
    include: {
      stops: {
        include: { location: true },
      },
      assignedTo: { include: { contact: true } },
      runs: {
        where: { status: "COMPLETED" },
        select: {
          id: true,
          startedAt: true,
          completedAt: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Get all deployed tins to find unallocated ones
  const allDeployedTins = await prisma.collectionTin.count({
    where: { status: "DEPLOYED" },
  });

  // Get location IDs that are on any active route
  const routeLocationIds = await prisma.routeStop.findMany({
    where: {
      route: { isActive: true },
    },
    select: { locationId: true },
    distinct: ["locationId"],
  });
  const allocatedLocationSet = new Set(routeLocationIds.map((r) => r.locationId));

  // Count deployed tins NOT on any route
  const unallocatedTins = await prisma.collectionTin.count({
    where: {
      status: "DEPLOYED",
      locationId: { notIn: [...allocatedLocationSet] },
    },
  });

  // Calculate average tins per route
  const totalTinsOnRoutes = routes.reduce((sum, r) => sum + r.stops.length, 0);
  const avgTinsPerRoute = routes.length > 0 ? Math.round(totalTinsOnRoutes / routes.length) : 0;

  // Calculate average route time from completed runs
  const allRunTimes: number[] = [];
  for (const route of routes) {
    for (const run of route.runs) {
      if (run.startedAt && run.completedAt) {
        const mins = Math.round(
          (new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 60000
        );
        if (mins > 0 && mins < 1440) {
          // Sanity check: between 0 and 24 hours
          allRunTimes.push(mins);
        }
      }
    }
  }
  const avgRouteTimeMins =
    allRunTimes.length > 0 ? Math.round(allRunTimes.reduce((a, b) => a + b, 0) / allRunTimes.length) : 0;

  // Calculate per-route average times
  const routeAvgTimes = new Map<string, number>();
  for (const route of routes) {
    const times: number[] = [];
    for (const run of route.runs) {
      if (run.startedAt && run.completedAt) {
        const mins = Math.round(
          (new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 60000
        );
        if (mins > 0 && mins < 1440) times.push(mins);
      }
    }
    if (times.length > 0) {
      routeAvgTimes.set(route.id, Math.round(times.reduce((a, b) => a + b, 0) / times.length));
    }
  }

  function formatTime(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finance/collection-tins/routes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Routes</h1>
            <p className="text-gray-500 mt-1">
              Your predefined collection routes — edit, manage stops, and schedule runs
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Route className="h-4 w-4 text-gray-400" />
            <p className="text-sm text-gray-500">Total Routes</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-gray-400" />
            <p className="text-sm text-gray-500">Avg Stops / Route</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgTinsPerRoute}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-gray-400" />
            <p className="text-sm text-gray-500">Avg Route Time</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {avgRouteTimeMins > 0 ? formatTime(avgRouteTimeMins) : "No data"}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-orange-400" />
            <p className="text-sm text-gray-500">Unallocated Tins</p>
          </div>
          <p className={`text-2xl font-bold ${unallocatedTins > 0 ? "text-orange-600" : "text-green-600"}`}>
            {unallocatedTins}
          </p>
          {unallocatedTins > 0 && (
            <p className="text-xs text-orange-500 mt-1">Deployed but not on any route</p>
          )}
        </Card>
      </div>

      {/* Routes List */}
      {routes.length === 0 ? (
        <EmptyState
          icon={Route}
          title="No predefined routes"
          description="Create a new route manually to see it here. Suggested routes are ad-hoc and won't appear in this list."
          actionLabel="New Route"
          actionHref="/finance/collection-tins/routes/new"
        />
      ) : (
        <div className="space-y-3">
          {routes.map((route) => {
            const routeAvg = routeAvgTimes.get(route.id);
            const isAboveAvg = routeAvg && avgRouteTimeMins > 0 && routeAvg > avgRouteTimeMins;
            const isBelowAvg = routeAvg && avgRouteTimeMins > 0 && routeAvg < avgRouteTimeMins;

            return (
              <Link key={route.id} href={`/finance/collection-tins/routes/${route.id}`}>
                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900 text-lg">{route.name}</h3>
                        {routeAvg && (
                          <Badge
                            className={
                              isAboveAvg
                                ? "bg-orange-100 text-orange-700"
                                : isBelowAvg
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }
                          >
                            {isAboveAvg && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {isBelowAvg && <CheckCircle className="h-3 w-3 mr-1" />}
                            {formatTime(routeAvg)} avg
                            {isAboveAvg && " (above avg)"}
                            {isBelowAvg && " (below avg)"}
                          </Badge>
                        )}
                      </div>
                      {route.description && (
                        <p className="text-sm text-gray-500 mt-1">{route.description}</p>
                      )}
                      <div className="flex items-center gap-5 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {route.stops.length} stops
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" />
                          {route.tinCount} tins
                        </span>
                        {route.assignedTo && (
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            {route.assignedTo.contact.firstName} {route.assignedTo.contact.lastName}
                          </span>
                        )}
                        {route.runs.length > 0 && (
                          <span className="text-green-600 font-medium">
                            {route.runs.length} run{route.runs.length !== 1 ? "s" : ""} completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
