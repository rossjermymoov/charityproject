import { prisma } from "@/lib/prisma";
import { Bell } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function RemindersPage() {
  const reminders = await prisma.reminder.findMany({
    include: {
      volunteer: { include: { contact: true } },
      createdBy: true,
    },
    orderBy: { triggerDate: "desc" },
    take: 50,
  });

  const upcoming = reminders.filter((r) => !r.isSent);
  const sent = reminders.filter((r) => r.isSent);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
        <p className="text-gray-500 mt-1">Upcoming and sent reminders for volunteers</p>
      </div>

      {reminders.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No reminders"
          description="Reminders will appear here when created manually or triggered by milestones."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Upcoming ({upcoming.length})</h2>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No upcoming reminders</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((r) => (
                    <div key={r.id} className="flex items-start justify-between py-2 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{r.title}</p>
                        <p className="text-xs text-gray-500">
                          For: {r.volunteer.contact.firstName} {r.volunteer.contact.lastName}
                        </p>
                        {r.message && <p className="text-xs text-gray-400 mt-0.5">{r.message}</p>}
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">{r.type}</Badge>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(r.triggerDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Sent ({sent.length})</h2>
            </CardHeader>
            <CardContent>
              {sent.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No sent reminders</p>
              ) : (
                <div className="space-y-3">
                  {sent.map((r) => (
                    <div key={r.id} className="flex items-start justify-between py-2 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{r.title}</p>
                        <p className="text-xs text-gray-500">
                          For: {r.volunteer.contact.firstName} {r.volunteer.contact.lastName}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800 text-xs">Sent</Badge>
                        <p className="text-xs text-gray-400 mt-1">{r.sentAt ? formatDate(r.sentAt) : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
