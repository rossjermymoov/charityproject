import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, Route, MapPin, Calendar, User, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const statusFilter = params.status || "";

  const routes = await prisma.collectionRoute.findMany({
    where: {
      AND: [
        search ? { name: { contains: search, mode: "insensitive" } } : {},
        statusFilter ? { status: statusFilter } : {},
      ],
    },
    include: {
      stops: { include: { location: true } },
      assignedTo: { include: { contact: true } },
      createdBy: true,
      tinReturns: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    READY: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    ARCHIVED: "bg-gray-100 text-gray-500",
  };

  const statuses = ["DRAFT", "READY", "IN_PROGRESS", "COMPLETED", "ARCHIVED"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collection Routes</h1>
          <p className="text-gray-500 mt-1">Plan and manage tin collection routes</p>
        </div>
        <div className="flex gap-2">
          <Link href="/finance/collection-tins/routes/returns">
            <Button variant="outline">
              <ArrowRight className="h-4 w-4 mr-2" />
              Process Returns
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
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Routes", value: routes.length },
          { label: "In Progress", value: routes.filter(r => r.status === "IN_PROGRESS").length },
          { label: "Ready", value: routes.filter(r => r.status === "READY").length },
          { label: "Completed", value: routes.filter(r => r.status === "COMPLETED").length },
        ].map(stat => (
          <Card key={stat.label} className="p-4">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <form className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search routes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </form>
        <div className="flex gap-1">
          <Link href="/finance/collection-tins/routes">
            <Button variant={!statusFilter ? "default" : "outline"} size="sm">All</Button>
          </Link>
          {statuses.map(s => (
            <Link key={s} href={`/finance/collection-tins/routes?status=${s}`}>
              <Button variant={statusFilter === s ? "default" : "outline"} size="sm">
                {s.replace("_", " ")}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Route list */}
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
          {routes.map(route => {
            const completedStops = route.stops.filter(s => s.status === "COMPLETED").length;
            const totalStops = route.stops.length;
            const totalReturned = route.tinReturns.reduce((sum, r) => sum + r.amount, 0);

            return (
              <Link key={route.id} href={`/finance/collection-tins/routes/${route.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{route.name}</h3>
                        <Badge className={statusColors[route.status] || "bg-gray-100 text-gray-800"}>
                          {route.status.replace("_", " ")}
                        </Badge>
                      </div>
                      {route.description && (
                        <p className="text-sm text-gray-500 mt-1">{route.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {totalStops} stops
                          {route.status !== "DRAFT" && ` (${completedStops} done)`}
                        </span>
                        {route.scheduledDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(route.scheduledDate)}
                          </span>
                        )}
                        {route.assignedTo && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {route.assignedTo.contact.firstName} {route.assignedTo.contact.lastName}
                          </span>
                        )}
                        {route.tinCount > 0 && (
                          <span>{route.tinCount} tins</span>
                        )}
                        {totalReturned > 0 && (
                          <span className="font-medium text-green-600">£{totalReturned.toFixed(2)} collected</span>
                        )}
                      </div>
                    </div>
                    {totalStops > 0 && route.status !== "DRAFT" && (
                      <div className="ml-4">
                        <div className="w-16 h-16 relative">
                          <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90">
                            <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none" stroke="#e5e7eb" strokeWidth="3" />
                            <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none" stroke="#4f46e5" strokeWidth="3"
                              strokeDasharray={`${(completedStops / totalStops) * 100}, 100`} />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                            {Math.round((completedStops / totalStops) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
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
