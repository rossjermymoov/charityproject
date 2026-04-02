import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Plus, Trash2, GripVertical, Calendar, User, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { updateRoute, addStop, removeStop, scheduleRun, deleteRoute } from "../actions";
import { ConfirmButton } from "@/components/ui/confirm-button";

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const route = await prisma.collectionRoute.findUnique({
    where: { id },
    include: {
      stops: {
        include: { location: true },
        orderBy: { sortOrder: "asc" },
      },
      assignedTo: { include: { contact: true } },
      createdBy: true,
      runs: {
        where: { status: "COMPLETED" },
        include: { assignedTo: { include: { contact: true } } },
        orderBy: { completedAt: "desc" },
      },
    },
  });

  if (!route) notFound();

  const locations = await prisma.tinLocation.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const volunteers = await prisma.volunteerProfile.findMany({
    where: { status: "ACTIVE" },
    include: { contact: true },
    orderBy: { contact: { lastName: "asc" } },
  });

  const totalStops = route.stops.length;

  // Calculate this route's average completion time
  const routeRunTimes: number[] = [];
  for (const run of route.runs) {
    if (run.startedAt && run.completedAt) {
      const mins = Math.round(
        (new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 60000
      );
      if (mins > 0 && mins < 1440) routeRunTimes.push(mins);
    }
  }
  const thisRouteAvg = routeRunTimes.length > 0
    ? Math.round(routeRunTimes.reduce((a, b) => a + b, 0) / routeRunTimes.length)
    : null;

  // Calculate global average across ALL completed runs
  const allCompletedRuns = await prisma.collectionRun.findMany({
    where: {
      status: "COMPLETED",
      startedAt: { not: null },
      completedAt: { not: null },
    },
    select: { startedAt: true, completedAt: true },
  });
  const allTimes = allCompletedRuns
    .map((r) => Math.round((new Date(r.completedAt!).getTime() - new Date(r.startedAt!).getTime()) / 60000))
    .filter((m) => m > 0 && m < 1440);
  const globalAvg = allTimes.length > 0 ? Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length) : null;

  const isAboveAvg = thisRouteAvg && globalAvg && thisRouteAvg > globalAvg;
  const isBelowAvg = thisRouteAvg && globalAvg && thisRouteAvg < globalAvg;

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
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Routes
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{route.name}</h1>
            {route.description && <p className="text-gray-500 mt-1">{route.description}</p>}
          </div>
        </div>
        <form action={deleteRoute}>
          <input type="hidden" name="routeId" value={route.id} />
          <ConfirmButton
            message="Delete this route and all its runs? This cannot be undone."
            variant="outline"
          >
            <Trash2 className="h-4 w-4" />
          </ConfirmButton>
        </form>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Stops</p>
          <p className="text-2xl font-bold">{totalStops}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Tins to Take</p>
          <p className="text-2xl font-bold">{route.tinCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Completed Runs</p>
          <p className="text-2xl font-bold text-green-600">{route.runs.length}</p>
        </Card>
        <Card className={`p-4 ${isAboveAvg ? "border-orange-200 bg-orange-50" : isBelowAvg ? "border-green-200 bg-green-50" : ""}`}>
          <div className="flex items-center gap-1.5">
            <Clock className={`h-3.5 w-3.5 ${isAboveAvg ? "text-orange-500" : isBelowAvg ? "text-green-500" : "text-gray-400"}`} />
            <p className="text-sm text-gray-500">Avg Time</p>
          </div>
          <p className={`text-2xl font-bold ${isAboveAvg ? "text-orange-600" : isBelowAvg ? "text-green-600" : ""}`}>
            {thisRouteAvg ? formatTime(thisRouteAvg) : "No data"}
          </p>
          {isAboveAvg && (
            <p className="text-xs text-orange-500 flex items-center gap-1 mt-1">
              <AlertTriangle className="h-3 w-3" /> Above average ({formatTime(globalAvg!)})
            </p>
          )}
          {isBelowAvg && (
            <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <CheckCircle className="h-3 w-3" /> Below average ({formatTime(globalAvg!)})
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Assigned To</p>
          <p className="font-medium text-sm">
            {route.assignedTo
              ? `${route.assignedTo.contact.firstName} ${route.assignedTo.contact.lastName}`
              : "Unassigned"}
          </p>
        </Card>
      </div>

      {/* Edit route form */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Details</h2>
        <form action={updateRoute} className="space-y-4">
          <input type="hidden" name="routeId" value={route.id} />
          <div>
            <Input label="Route Name" name="name" required defaultValue={route.name} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={route.description || ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Notes, warnings, special instructions..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Number of Tins" name="tinCount" type="number" min="0" defaultValue={route.tinCount} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Volunteer</label>
              <select name="assignedToId" defaultValue={route.assignedToId || ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Unassigned</option>
                {volunteers.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.contact.firstName} {v.contact.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Card>

      {/* Stops */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Stops</h2>

        {route.stops.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No stops added yet.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {route.stops.map((stop, index) => (
              <div
                key={stop.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white"
              >
                <div className="flex items-center gap-2 text-gray-400 w-8">
                  <GripVertical className="h-4 w-4" />
                  <span className="text-sm font-mono">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{stop.location.name}</span>
                  </div>
                  <p className="text-sm text-gray-500 ml-6">
                    {[stop.location.address, stop.location.city, stop.location.postcode].filter(Boolean).join(", ")}
                  </p>
                  {stop.parkingNotes && (
                    <p className="text-sm text-orange-600 ml-6 mt-1">Parking: {stop.parkingNotes}</p>
                  )}
                  {stop.accessNotes && (
                    <p className="text-sm text-blue-600 ml-6">Access: {stop.accessNotes}</p>
                  )}
                </div>
                <form action={removeStop}>
                  <input type="hidden" name="stopId" value={stop.id} />
                  <input type="hidden" name="routeId" value={route.id} />
                  <button type="submit" className="text-gray-400 hover:text-red-600 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        {/* Add stop form */}
        <form action={addStop} className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Add Stop</h3>
          <input type="hidden" name="routeId" value={route.id} />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Location</label>
              <select name="locationId" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Select location...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} — {loc.postcode || loc.city || "No address"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Input label="Parking Notes" name="parkingNotes" placeholder="e.g. Park on side street" />
            </div>
            <div>
              <Input label="Access Notes" name="accessNotes" placeholder="e.g. Ask for Dave" />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Stop
            </Button>
          </div>
        </form>
      </Card>

      {/* Schedule Run form */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule a Run</h2>
        <form action={scheduleRun} className="space-y-4">
          <input type="hidden" name="routeId" value={route.id} />
          <p className="text-sm text-gray-600 mb-4">Create a new instance of this route to execute on a specific date.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Scheduled Date"
                name="scheduledDate"
                type="date"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volunteer (optional)</label>
              <select name="assignedToId" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Use default ({route.assignedTo?.contact.firstName || "Unassigned"})</option>
                {volunteers.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.contact.firstName} {v.contact.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Schedule Run</Button>
          </div>
        </form>
      </Card>

      {/* Run History */}
      {route.runs.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Run History</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">Date</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Volunteer</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {route.runs.map(run => (
                <tr key={run.id} className="border-b last:border-0">
                  <td className="py-2">{run.completedAt ? formatDate(run.completedAt) : "—"}</td>
                  <td className="py-2 font-medium text-green-600">Completed</td>
                  <td className="py-2">
                    {run.assignedTo
                      ? `${run.assignedTo.contact.firstName} ${run.assignedTo.contact.lastName}`
                      : "—"}
                  </td>
                  <td className="py-2 text-right">
                    <Link href={`/finance/collection-tins/routes/run/${run.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
