import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { getStatusColor } from "@/lib/utils";

export default async function AssignmentsPage() {
  const assignments = await prisma.assignment.findMany({
    include: {
      volunteer: { include: { contact: true } },
      department: true,
      createdBy: true,
    },
    orderBy: { date: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-500 mt-1">Schedule and manage volunteer shifts</p>
        </div>
        <Link href="/dashboard/assignments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Assignment
          </Button>
        </Link>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No assignments"
          description="Create assignments to schedule volunteer shifts."
          actionLabel="New Assignment"
          actionHref="/dashboard/assignments/new"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volunteer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar firstName={a.volunteer.contact.firstName} lastName={a.volunteer.contact.lastName} size="sm" />
                        <span className="text-sm font-medium text-gray-900">
                          {a.volunteer.contact.firstName} {a.volunteer.contact.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{a.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{a.department.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{a.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{a.startTime} - {a.endTime}</td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(a.status)}>{a.status}</Badge>
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
