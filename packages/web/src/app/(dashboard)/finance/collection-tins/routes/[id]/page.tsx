import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Plus, Trash2, GripVertical, Play, CheckCircle, SkipForward, Calendar, User, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { updateRoute, addStop, removeStop, startRoute, completeRoute, deleteRoute } from "../actions";
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
        include: {
          location: true,
          deployedTin: true,
          collectedTin: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      assignedTo: { include: { contact: true } },
      createdBy: true,
      tinReturns: { include: { tin: true, countedBy: true } },
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

  const completedStops = route.stops.filter(s => s.status === "COMPLETED").length;
  const skippedStops = route.stops.filter(s => s.status === "SKIPPED").length;
  const totalStops = route.stops.length;
  const totalReturned = route.tinReturns.reduce((sum, r) => sum + r.amount, 0);

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    READY: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    ARCHIVED: "bg-gray-100 text-gray-500",
  };

  const stopStatusColors: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-600",
    COMPLETED: "bg-green-100 text-green-800",
    SKIPPED: "bg-orange-100 text-orange-800",
  };

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
              <h1 className="text-2xl font-bold text-gray-900">{route.name}</h1>
              <Badge className={statusColors[route.status]}>
                {route.status.replace("_", " ")}
              </Badge>
            </div>
            {route.description && <p className="text-gray-500 mt-1">{route.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {route.status === "DRAFT" && totalStops > 0 && (
            <form action={updateRoute}>
              <input type="hidden" name="routeId" value={route.id} />
              <input type="hidden" name="name" value={route.name} />
              <input type="hidden" name="tinCount" value={route.tinCount} />
              <input type="hidden" name="status" value="READY" />
              <Button type="submit" variant="outline">Mark Ready</Button>
            </form>
          )}
          {route.status === "READY" && (
            <form action={startRoute}>
              <input type="hidden" name="routeId" value={route.id} />
              <Button type="submit">
                <Play className="h-4 w-4 mr-2" />
                Start Route
              </Button>
            </form>
          )}
          {(route.status === "READY" || route.status === "IN_PROGRESS") && (
            <Link href={`/mobile/route/${route.id}`} target="_blank">
              <Button variant="outline">
                📱 Mobile View
              </Button>
            </Link>
          )}
          {route.status === "COMPLETED" && (
            <Link href={`/finance/collection-tins/routes/count/${route.id}`}>
              <Button>
                <Package className="h-4 w-4 mr-2" />
                Count Tins
              </Button>
            </Link>
          )}
          {route.status === "IN_PROGRESS" && (
            <form action={completeRoute}>
              <input type="hidden" name="routeId" value={route.id} />
              <Button type="submit">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Route
              </Button>
            </form>
          )}
          {(route.status === "DRAFT" || route.status === "READY" || route.status === "COMPLETED" || route.status === "ARCHIVED") && (
            <form action={deleteRoute}>
              <input type="hidden" name="routeId" value={route.id} />
              <ConfirmButton
                message="Delete this route? This cannot be undone."
                variant="outline"
              >
                <Trash2 className="h-4 w-4" />
              </ConfirmButton>
            </form>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Stops</p>
          <p className="text-2xl font-bold">{totalStops}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completedStops}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Skipped</p>
          <p className="text-2xl font-bold text-orange-600">{skippedStops}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Tins to Take</p>
          <p className="text-2xl font-bold">{route.tinCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Collected</p>
          <p className="text-2xl font-bold text-green-600">£{totalReturned.toFixed(2)}</p>
        </Card>
      </div>

      {/* Route info */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Assigned To</p>
          <p className="font-medium">
            {route.assignedTo
              ? `${route.assignedTo.contact.firstName} ${route.assignedTo.contact.lastName}`
              : "Unassigned"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Scheduled</p>
          <p className="font-medium">{route.scheduledDate ? formatDate(route.scheduledDate) : "Not scheduled"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Created</p>
          <p className="font-medium">{formatDate(route.createdAt)} by {route.createdBy.name}</p>
        </Card>
      </div>

      {/* Stops */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Route Stops</h2>
          {route.status === "DRAFT" && (
            <span className="text-sm text-gray-500">Drag to reorder stops</span>
          )}
        </div>

        {route.stops.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No stops added yet. Add locations below.</p>
        ) : (
          <div className="space-y-2">
            {route.stops.map((stop, index) => (
              <div
                key={stop.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white"
              >
                <div className="flex items-center gap-2 text-gray-400 w-8">
                  {route.status === "DRAFT" && <GripVertical className="h-4 w-4" />}
                  <span className="text-sm font-mono">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{stop.location.name}</span>
                    <Badge className={stopStatusColors[stop.status]}>{stop.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 ml-6">
                    {[stop.location.address, stop.location.city, stop.location.postcode].filter(Boolean).join(", ")}
                  </p>
                  {stop.parkingNotes && (
                    <p className="text-sm text-orange-600 ml-6 mt-1">🅿️ {stop.parkingNotes}</p>
                  )}
                  {stop.accessNotes && (
                    <p className="text-sm text-blue-600 ml-6">ℹ️ {stop.accessNotes}</p>
                  )}
                  {stop.deployedTin && (
                    <p className="text-xs text-gray-500 ml-6 mt-1">
                      Left: {stop.deployedTin.tinNumber} | Collected: {stop.collectedTin?.tinNumber || "—"}
                    </p>
                  )}
                  {stop.skipReason && (
                    <p className="text-sm text-orange-600 ml-6 mt-1">Skipped: {stop.skipReason}</p>
                  )}
                </div>
                {stop.completedAt && (
                  <span className="text-xs text-gray-400">{formatDate(stop.completedAt)}</span>
                )}
                {route.status === "DRAFT" && (
                  <form action={removeStop}>
                    <input type="hidden" name="stopId" value={stop.id} />
                    <input type="hidden" name="routeId" value={route.id} />
                    <button type="submit" className="text-gray-400 hover:text-red-600 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add stop form */}
        {route.status === "DRAFT" && (
          <form action={addStop} className="mt-4 p-4 bg-gray-50 rounded-lg">
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
        )}
      </Card>

      {/* Returns for this route */}
      {route.tinReturns.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Processed Returns</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">Tin</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Counted By</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {route.tinReturns.map(ret => (
                <tr key={ret.id} className="border-b last:border-0">
                  <td className="py-2 font-mono">{ret.tin.tinNumber}</td>
                  <td className="py-2 font-medium text-green-600">£{ret.amount.toFixed(2)}</td>
                  <td className="py-2">{ret.countedBy.name}</td>
                  <td className="py-2 text-gray-500">{formatDate(ret.returnedAt)}</td>
                  <td className="py-2 text-gray-500">{ret.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
