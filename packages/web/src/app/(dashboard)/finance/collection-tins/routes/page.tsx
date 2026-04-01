import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, Route, MapPin, Calendar, User, Coins, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";

  // Get route templates
  const routes = await prisma.collectionRoute.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : {},
    include: {
      stops: true,
      assignedTo: { include: { contact: true } },
      runs: {
        where: { status: "COMPLETED" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Get upcoming runs (SCHEDULED or IN_PROGRESS)
  const upcomingRuns = await prisma.collectionRun.findMany({
    where: {
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
    },
    include: {
      route: true,
      assignedTo: { include: { contact: true } },
    },
    orderBy: { scheduledDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collection Routes</h1>
          <p className="text-gray-500 mt-1">Manage route templates and schedule collections</p>
        </div>
        <div className="flex gap-2">
          <Link href="/finance/collection-tins/routes/count">
            <Button variant="outline">
              <Coins className="h-4 w-4 mr-2" />
              Count Tins
            </Button>
          </Link>
          <Link href="/finance/collection-tins/routes/suggest">
            <Button variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Suggest Route
            </Button>
          </Link>
          <Link href="/finance/collection-tins/routes/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Route
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Routes</p>
          <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Upcoming Runs</p>
          <p className="text-2xl font-bold text-blue-600">{upcomingRuns.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Completed Runs</p>
          <p className="text-2xl font-bold text-green-600">
            {routes.reduce((sum, r) => sum + r.runs.length, 0)}
          </p>
        </Card>
      </div>

      {/* Search */}
      <form className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          name="search"
          defaultValue={search}
          placeholder="Search routes..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </form>

      {/* Your Routes section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Route className="h-5 w-5" />
          Your Routes ({routes.length})
        </h2>
        {routes.length === 0 ? (
          <EmptyState
            icon={Route}
            title="No routes found"
            description="Create your first collection route to get started."
            actionLabel="New Route"
            actionHref="/finance/collection-tins/routes/new"
          />
        ) : (
          <div className="space-y-3">
            {routes.map((route) => (
              <Link key={route.id} href={`/finance/collection-tins/routes/${route.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{route.name}</h3>
                      </div>
                      {route.description && (
                        <p className="text-sm text-gray-500 mt-1">{route.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {route.stops.length} stops
                        </span>
                        {route.assignedTo && (
                          <span className="flex items-center gap-1">
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
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Runs section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Runs ({upcomingRuns.length})
        </h2>
        {upcomingRuns.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No scheduled or in-progress runs.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingRuns.map((run) => (
              <Link key={run.id} href={`/finance/collection-tins/routes/run/${run.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{run.route.name}</h3>
                        <Badge className={run.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}>
                          {run.status === "IN_PROGRESS" ? "In Progress" : "Scheduled"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        {run.scheduledDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(run.scheduledDate)}
                          </span>
                        )}
                        {run.assignedTo && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {run.assignedTo.contact.firstName} {run.assignedTo.contact.lastName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
