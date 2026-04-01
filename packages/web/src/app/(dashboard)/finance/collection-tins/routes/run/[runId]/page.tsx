import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Play, CheckCircle, X, Calendar, User, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { startRun, completeRun, cancelRun } from "../../actions";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId: id } = await params;

  const run = await prisma.collectionRun.findUnique({
    where: { id },
    include: {
      route: {
        include: { stops: { orderBy: { sortOrder: "asc" } } },
      },
      assignedTo: { include: { contact: true } },
      createdBy: true,
      runStops: {
        include: {
          routeStop: { include: { location: true } },
          deployedTin: true,
          collectedTin: true,
        },
        orderBy: { routeStop: { sortOrder: "asc" } },
      },
      tinReturns: { include: { tin: true } },
    },
  });

  if (!run) notFound();

  const statusColors: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  const stopStatusColors: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-600",
    COMPLETED: "bg-green-100 text-green-800",
    SKIPPED: "bg-orange-100 text-orange-800",
  };

  const totalRunStops = run.runStops.length;
  const completedRunStops = run.runStops.filter((s) => s.status === "COMPLETED").length;
  const skippedRunStops = run.runStops.filter((s) => s.status === "SKIPPED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finance/collection-tins/routes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Routes
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{run.route.name}</h1>
              <Badge className={statusColors[run.status]}>
                {run.status === "SCHEDULED"
                  ? "Scheduled"
                  : run.status === "IN_PROGRESS"
                    ? "In Progress"
                    : run.status === "COMPLETED"
                      ? "Completed"
                      : "Cancelled"}
              </Badge>
            </div>
            {run.scheduledDate && (
              <p className="text-gray-500 mt-1">{formatDate(run.scheduledDate)}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {run.status === "SCHEDULED" && (
            <form action={startRun}>
              <input type="hidden" name="runId" value={run.id} />
              <Button type="submit">
                <Play className="h-4 w-4 mr-2" />
                Start Run
              </Button>
            </form>
          )}
          {run.status === "IN_PROGRESS" && (
            <>
              <Link href={`/mobile/route/${run.id}`} target="_blank">
                <Button variant="outline">
                  📱 Mobile View
                </Button>
              </Link>
              <form action={completeRun}>
                <input type="hidden" name="runId" value={run.id} />
                <Button type="submit">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Run
                </Button>
              </form>
            </>
          )}
          {run.status === "SCHEDULED" && (
            <form action={cancelRun}>
              <input type="hidden" name="runId" value={run.id} />
              <Button type="submit" variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </form>
          )}
          {run.status === "COMPLETED" && (
            <Link href={`/finance/collection-tins/routes/count/${run.id}`}>
              <Button>
                <Package className="h-4 w-4 mr-2" />
                Count Tins
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Stops</p>
          <p className="text-2xl font-bold">{totalRunStops}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completedRunStops}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Skipped</p>
          <p className="text-2xl font-bold text-orange-600">{skippedRunStops}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Volunteer</p>
          <p className="text-sm font-medium">
            {run.assignedTo
              ? `${run.assignedTo.contact.firstName} ${run.assignedTo.contact.lastName}`
              : "Unassigned"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Created</p>
          <p className="text-sm font-medium">{formatDate(run.createdAt)}</p>
        </Card>
      </div>

      {/* Run info */}
      <div className="grid grid-cols-3 gap-4">
        {run.scheduledDate && (
          <Card className="p-4">
            <p className="text-sm text-gray-500 mb-1">Scheduled Date</p>
            <p className="font-medium">{formatDate(run.scheduledDate)}</p>
          </Card>
        )}
        {run.startedAt && (
          <Card className="p-4">
            <p className="text-sm text-gray-500 mb-1">Started</p>
            <p className="font-medium">{formatDate(run.startedAt)}</p>
          </Card>
        )}
        {run.completedAt && (
          <Card className="p-4">
            <p className="text-sm text-gray-500 mb-1">Completed</p>
            <p className="font-medium">{formatDate(run.completedAt)}</p>
          </Card>
        )}
      </div>

      {/* Run Stops */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Collection Stops</h2>

        {run.runStops.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No stops in this run.</p>
        ) : (
          <div className="space-y-2">
            {run.runStops.map((runStop, index) => (
              <div
                key={runStop.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white"
              >
                <div className="flex items-center gap-2 text-gray-400 w-8">
                  <span className="text-sm font-mono">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{runStop.routeStop.location.name}</span>
                    <Badge className={stopStatusColors[runStop.status]}>
                      {runStop.status === "PENDING"
                        ? "Pending"
                        : runStop.status === "COMPLETED"
                          ? "Completed"
                          : "Skipped"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 ml-6">
                    {[
                      runStop.routeStop.location.address,
                      runStop.routeStop.location.city,
                      runStop.routeStop.location.postcode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {runStop.routeStop.parkingNotes && (
                    <p className="text-sm text-orange-600 ml-6 mt-1">
                      Parking: {runStop.routeStop.parkingNotes}
                    </p>
                  )}
                  {runStop.routeStop.accessNotes && (
                    <p className="text-sm text-blue-600 ml-6">
                      Access: {runStop.routeStop.accessNotes}
                    </p>
                  )}
                  {runStop.status === "COMPLETED" && (
                    <p className="text-xs text-gray-500 ml-6 mt-1">
                      Deployed: {runStop.deployedTin?.tinNumber || "—"} | Collected:{" "}
                      {runStop.collectedTin?.tinNumber || "—"}
                    </p>
                  )}
                  {runStop.skipReason && (
                    <p className="text-sm text-orange-600 ml-6 mt-1">
                      Skipped: {runStop.skipReason}
                    </p>
                  )}
                </div>
                {runStop.completedAt && (
                  <span className="text-xs text-gray-400">{formatDate(runStop.completedAt)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Counted tins */}
      {run.tinReturns.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Counted Tins</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">Tin</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {run.tinReturns.map((ret) => (
                <tr key={ret.id} className="border-b last:border-0">
                  <td className="py-2 font-mono">{ret.tin.tinNumber}</td>
                  <td className="py-2 font-medium text-green-600">
                    £{ret.amount.toFixed(2)}
                  </td>
                  <td className="py-2 text-gray-500">{formatDate(ret.returnedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
