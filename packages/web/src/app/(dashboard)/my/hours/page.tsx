import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

export default async function MyHoursPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.contactId) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Account Not Linked</h2>
        <p className="text-gray-500 mt-2">Your account is not linked to a volunteer record.</p>
      </div>
    );
  }

  const volunteer = await prisma.volunteerProfile.findFirst({
    where: { contactId: session.contactId },
  });

  if (!volunteer) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">No Volunteer Profile</h2>
        <p className="text-gray-500 mt-2">You don&apos;t have a volunteer profile set up yet.</p>
      </div>
    );
  }

  const hours = await prisma.volunteerHoursLog.findMany({
    where: { volunteerId: volunteer.id },
    orderBy: { createdAt: "desc" },
    include: { department: true },
  });

  const totalHours = hours.reduce((s, h) => s + h.hours, 0);
  const thisYear = hours
    .filter((h) => new Date(h.createdAt).getFullYear() === new Date().getFullYear())
    .reduce((s, h) => s + h.hours, 0);
  const verified = hours.filter((h) => h.status === "VERIFIED").reduce((s, h) => s + h.hours, 0);

  const statusColors: Record<string, string> = {
    LOGGED: "bg-blue-100 text-blue-800",
    VERIFIED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Hours</h1>
        <p className="text-gray-500 mt-1">Your volunteering hours log</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-indigo-600">{totalHours.toFixed(1)} hrs</p>
            <p className="text-sm text-gray-500">Total Hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-600">{thisYear.toFixed(1)} hrs</p>
            <p className="text-sm text-gray-500">This Year</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-amber-600">{verified.toFixed(1)} hrs</p>
            <p className="text-sm text-gray-500">Verified</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Hours Log</h2>
        </CardHeader>
        <CardContent>
          {hours.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No hours logged yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {hours.map((h) => (
                    <tr key={h.id}>
                      <td className="px-4 py-3 text-gray-900">{h.date}</td>
                      <td className="px-4 py-3 text-gray-600">{h.department?.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{h.description || "—"}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{h.hours.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={statusColors[h.status] || ""}>{h.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
