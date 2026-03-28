import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Users, UserCheck, Radio, Clock } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();

  const [contactCount, volunteerCount, activeVolunteers, openBroadcasts, recentBroadcasts, upcomingAssignments] = await Promise.all([
    prisma.contact.count(),
    prisma.volunteerProfile.count(),
    prisma.volunteerProfile.count({ where: { status: "ACTIVE" } }),
    prisma.broadcast.count({ where: { status: "OPEN" } }),
    prisma.broadcast.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { department: true, responses: true },
    }),
    prisma.assignment.findMany({
      where: { status: { in: ["SCHEDULED", "CONFIRMED"] } },
      orderBy: { date: "asc" },
      take: 5,
      include: { volunteer: { include: { contact: true } }, department: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {session?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Contacts" value={contactCount} icon={Users} />
        <StatCard title="Total Volunteers" value={volunteerCount} icon={UserCheck} />
        <StatCard title="Active Volunteers" value={activeVolunteers} icon={UserCheck} />
        <StatCard title="Open Broadcasts" value={openBroadcasts} icon={Radio} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Broadcasts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Broadcasts</h2>
              <Link href="/dashboard/broadcasts" className="text-sm text-indigo-600 hover:text-indigo-800">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentBroadcasts.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No broadcasts yet</p>
            ) : (
              <div className="space-y-3">
                {recentBroadcasts.map((broadcast) => (
                  <Link
                    key={broadcast.id}
                    href={`/dashboard/broadcasts/${broadcast.id}`}
                    className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{broadcast.title}</p>
                      <p className="text-xs text-gray-500">
                        {broadcast.department?.name} • {broadcast.responses.length} responses
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(broadcast.urgency)}>{broadcast.urgency}</Badge>
                      <Badge className={getStatusColor(broadcast.status)}>{broadcast.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Assignments</h2>
              <Link href="/dashboard/assignments" className="text-sm text-indigo-600 hover:text-indigo-800">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No upcoming assignments</p>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{assignment.title}</p>
                      <p className="text-xs text-gray-500">
                        {assignment.volunteer.contact.firstName} {assignment.volunteer.contact.lastName} • {assignment.department.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{assignment.date}</p>
                      <p className="text-xs text-gray-500">{assignment.startTime} - {assignment.endTime}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
