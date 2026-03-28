import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; type?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const statusFilter = params.status || "";
  const typeFilter = params.type || "";

  const events = await prisma.event.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search } },
                { location: { contains: search } },
              ],
            }
          : {},
        statusFilter ? { status: statusFilter } : {},
        typeFilter ? { type: typeFilter } : {},
      ],
    },
    include: {
      campaign: true,
      _count: {
        select: { attendees: true },
      },
    },
    orderBy: { startDate: "desc" },
    take: 50,
  });

  const statusColors: Record<string, string> = {
    PLANNED: "bg-gray-100 text-gray-800",
    OPEN: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">Manage your events and attendees</p>
        </div>
        <Link href="/dashboard/events/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
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
              placeholder="Search by name or location..."
              className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
            />
          </div>
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="PLANNED">Planned</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            name="type"
            defaultValue={typeFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="FUNDRAISER">Fundraiser</option>
            <option value="GALA">Gala</option>
            <option value="AUCTION">Auction</option>
            <option value="CHALLENGE">Challenge</option>
            <option value="COMMUNITY">Community</option>
            <option value="MEMORIAL">Memorial</option>
            <option value="OTHER">Other</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
      </Card>

      {/* Events table */}
      {events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events found"
          description="Get started by creating your first event."
          actionLabel="Create Event"
          actionHref="/dashboard/events/new"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/events/${event.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {event.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {event.type || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(event.startDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {event.location || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {event.campaign?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {event._count.attendees}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[event.status] || ""}>
                        {event.status}
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
