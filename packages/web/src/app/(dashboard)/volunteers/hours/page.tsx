import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { Clock, Trash2 } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusColor } from "@/lib/utils";

export default async function HoursPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const hoursLogs = await prisma.volunteerHoursLog.findMany({
    include: {
      volunteer: { include: { contact: true } },
      department: true,
      verifiedBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const pendingCount = hoursLogs.filter((h) => h.status === "LOGGED").length;

  async function verifyHours(formData: FormData) {
    "use server";
    const s = await getSession();
    if (!s) redirect("/login");
    const logId = formData.get("logId") as string;
    await prisma.volunteerHoursLog.update({
      where: { id: logId },
      data: { status: "VERIFIED", verifiedById: s.id },
    });
    revalidatePath("/volunteers/hours");
  }

  async function deleteHours(formData: FormData) {
    "use server";
    const s = await getSession();
    if (!s) redirect("/login");
    const logId = formData.get("logId") as string;
    await prisma.volunteerHoursLog.delete({
      where: { id: logId },
    });
    revalidatePath("/volunteers/hours");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hours Verification</h1>
        <p className="text-gray-500 mt-1">
          Review and verify volunteer hours. {pendingCount} pending verification.
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volunteer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {hoursLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {log.volunteer.contact.firstName} {log.volunteer.contact.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{log.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.hours}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{log.department?.name || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{log.description || "—"}</td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusColor(log.status)}>{log.status}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {log.status === "LOGGED" && (
                        <form action={verifyHours} className="inline">
                          <input type="hidden" name="logId" value={log.id} />
                          <Button type="submit" size="sm" variant="outline">Verify</Button>
                        </form>
                      )}
                      <form
                        action={deleteHours}
                        className="inline"
                        onSubmit={(e) => {
                          if (!confirm("Are you sure you want to delete this hours log?")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="logId" value={log.id} />
                        <Button type="submit" size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                      {log.verifiedBy && (
                        <span className="text-xs text-gray-400">by {log.verifiedBy.name}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
