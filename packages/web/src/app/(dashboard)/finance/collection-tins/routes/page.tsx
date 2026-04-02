import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Route, MapPin, Calendar, User, Coins, Sparkles, FolderOpen, Settings, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function RoutesPage() {
  // Get the collection mode setting
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    select: { collectionMode: true },
  });
  const mode = settings?.collectionMode || "SUGGESTED_ROUTES";

  // Get upcoming runs (SCHEDULED or IN_PROGRESS)
  const upcomingRuns = await prisma.collectionRun.findMany({
    where: {
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
    },
    include: {
      route: true,
      assignedTo: { include: { contact: true } },
      runStops: { select: { status: true } },
    },
    orderBy: { scheduledDate: "asc" },
  });

  // Get completed run count
  const completedRunCount = await prisma.collectionRun.count({
    where: { status: "COMPLETED" },
  });

  // Get total route count (for stats)
  const routeCount = await prisma.collectionRoute.count({
    where: { isActive: true, ...(mode === "MY_ROUTES" ? { source: "MANUAL" } : {}) },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collection Routes</h1>
          <p className="text-gray-500 mt-1">
            {mode === "MY_ROUTES"
              ? "Manage predefined routes, generate with AI, and schedule collections"
              : "Use AI-suggested routes to optimise your collections"}
          </p>
        </div>
        <div className="flex gap-2">
          {mode === "MY_ROUTES" && (
            <Link href="/finance/collection-tins/routes/my-routes">
              <Button variant="outline">
                <FolderOpen className="h-4 w-4 mr-2" />
                My Routes
              </Button>
            </Link>
          )}
          <Link href="/finance/collection-tins/routes/suggest">
            <Button variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Suggest Route
            </Button>
          </Link>
          <Link href="/finance/collection-tins/routes/count">
            <Button variant="outline">
              <Coins className="h-4 w-4 mr-2" />
              Count Tins
            </Button>
          </Link>
          {mode === "MY_ROUTES" && (
            <>
              <Link href="/finance/collection-tins/routes/generate">
                <Button variant="outline">
                  <Wand2 className="h-4 w-4 mr-2" />
                  AI Generate Routes
                </Button>
              </Link>
              <Link href="/finance/collection-tins/routes/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Route
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">{mode === "MY_ROUTES" ? "Predefined Routes" : "Total Routes"}</p>
          <p className="text-2xl font-bold text-gray-900">{routeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Upcoming Runs</p>
          <p className="text-2xl font-bold text-blue-600">{upcomingRuns.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Completed Runs</p>
          <p className="text-2xl font-bold text-green-600">{completedRunCount}</p>
        </Card>
      </div>

      {/* Mode indicator */}
      <Card className="p-4 bg-gray-50 border-dashed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {mode === "MY_ROUTES" ? (
              <>
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Route className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">My Routes Mode</p>
                  <p className="text-xs text-gray-500">Predefined routes assigned to volunteers</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Suggested Routes Mode</p>
                  <p className="text-xs text-gray-500">AI-generated routes based on distance and collection data</p>
                </div>
              </>
            )}
          </div>
          <Link href="/settings/collection-tins">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Change
            </Button>
          </Link>
        </div>
      </Card>

      {/* Upcoming Runs section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Runs ({upcomingRuns.length})
        </h2>
        {upcomingRuns.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No scheduled or in-progress runs.</p>
            {mode === "MY_ROUTES" ? (
              <p className="text-sm text-gray-400 mt-1">Go to My Routes to schedule a run.</p>
            ) : (
              <p className="text-sm text-gray-400 mt-1">Use Suggest Route to create a new collection run.</p>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingRuns.map((run) => {
              const totalStops = run.runStops.length;
              const doneStops = run.runStops.filter((rs: { status: string }) => rs.status !== "PENDING").length;
              const pct = totalStops > 0 ? Math.round((doneStops / totalStops) * 100) : 0;
              return (
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
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {totalStops} stops
                          </span>
                          {run.assignedTo && (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {run.assignedTo.contact.firstName} {run.assignedTo.contact.lastName}
                            </span>
                          )}
                        </div>
                        {doneStops > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>{doneStops} of {totalStops} completed</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full">
                              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
