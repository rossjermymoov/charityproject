import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

export default async function MyAssignmentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.contactId) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Account Not Linked</h2>
        <p className="text-gray-500 mt-2">Your account is not linked to a volunteer record.</p>
      </div>
    );
  }

  // Find volunteer profile via contact
  const volunteer = await prisma.volunteerProfile.findFirst({
    where: { contactId: session.contactId },
  });

  if (!volunteer) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">No Volunteer Profile</h2>
        <p className="text-gray-500 mt-2">You don&apos;t have a volunteer profile set up yet.</p>
      </div>
    );
  }

  const [upcoming, past] = await Promise.all([
    prisma.assignment.findMany({
      where: {
        volunteerId: volunteer.id,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      orderBy: { date: "asc" },
      include: { department: true },
    }),
    prisma.assignment.findMany({
      where: {
        volunteerId: volunteer.id,
        status: { in: ["COMPLETED", "CANCELLED"] },
      },
      orderBy: { date: "desc" },
      take: 20,
      include: { department: true },
    }),
  ]);

  const statusColors: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800",
    CONFIRMED: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
        <p className="text-gray-500 mt-1">Your upcoming and past volunteer assignments</p>
      </div>

      {/* Upcoming */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Upcoming ({upcoming.length})
          </h2>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No upcoming assignments</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((a) => (
                <div key={a.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{a.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {a.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {a.startTime} - {a.endTime}
                        </span>
                      </div>
                      {a.department && (
                        <p className="text-sm text-gray-500 mt-1">{a.department.name}</p>
                      )}
                    </div>
                    <Badge className={statusColors[a.status] || ""}>{a.status}</Badge>
                  </div>
                  {a.description && <p className="text-sm text-gray-600 mt-2">{a.description}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Past Assignments</h2>
        </CardHeader>
        <CardContent>
          {past.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No past assignments</p>
          ) : (
            <div className="space-y-2">
              {past.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-500">{a.date} · {a.department?.name}</p>
                  </div>
                  <Badge className={statusColors[a.status] || ""}>{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
