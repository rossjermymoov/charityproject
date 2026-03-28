import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, Wrench, Shield, Bell, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getStatusColor, formatDate } from "@/lib/utils";

export default async function VolunteerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const volunteer = await prisma.volunteerProfile.findUnique({
    where: { id },
    include: {
      contact: true,
      departments: { include: { department: true } },
      skills: { include: { skill: true } },
      availability: true,
      specialConsiderations: true,
      hoursLogs: { include: { department: true }, orderBy: { date: "desc" }, take: 20 },
      activityRecords: { include: { department: true }, orderBy: { date: "desc" }, take: 20 },
      assignments: { include: { department: true }, orderBy: { date: "desc" }, take: 10 },
      reminders: { orderBy: { triggerDate: "desc" }, take: 10 },
    },
  });

  if (!volunteer) notFound();

  const totalHours = volunteer.hoursLogs.reduce((sum, log) => sum + log.hours, 0);
  const verifiedHours = volunteer.hoursLogs
    .filter((log) => log.status === "VERIFIED")
    .reduce((sum, log) => sum + log.hours, 0);

  async function logHours(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.volunteerHoursLog.create({
      data: {
        volunteerId: id,
        date: formData.get("date") as string,
        hours: parseFloat(formData.get("hours") as string),
        description: (formData.get("description") as string) || null,
        departmentId: (formData.get("departmentId") as string) || null,
      },
    });
    redirect(`/volunteers/${id}`);
  }

  const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const dayNames: Record<string, string> = {
    MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday",
    FRI: "Friday", SAT: "Saturday", SUN: "Sunday",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/volunteers" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Volunteer Profile</h1>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar firstName={volunteer.contact.firstName} lastName={volunteer.contact.lastName} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">
                  {volunteer.contact.firstName} {volunteer.contact.lastName}
                </h2>
                <Badge className={getStatusColor(volunteer.status)}>{volunteer.status}</Badge>
                <Link href={`/crm/contacts/${volunteer.contactId}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-gray-50">CRM Profile →</Badge>
                </Link>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                {volunteer.contact.email && <span>{volunteer.contact.email}</span>}
                {volunteer.contact.phone && <span>{volunteer.contact.phone}</span>}
                {volunteer.startDate && <span>Started: {volunteer.startDate}</span>}
                {volunteer.desiredHoursPerWeek && <span>{volunteer.desiredHoursPerWeek} hrs/week desired</span>}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {volunteer.departments.map((vd) => (
                  <Badge key={vd.departmentId} variant="secondary">{vd.department.name}</Badge>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-600">{totalHours.toFixed(1)}</p>
              <p className="text-xs text-gray-500">total hours</p>
              <p className="text-sm font-medium text-green-600 mt-1">{verifiedHours.toFixed(1)} verified</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
            </div>
          </CardHeader>
          <CardContent>
            {volunteer.skills.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No skills assigned</p>
            ) : (
              <div className="space-y-2">
                {volunteer.skills.map((vs) => (
                  <div key={vs.id} className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-gray-900">{vs.skill.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{vs.proficiency}</Badge>
                      {vs.verifiedAt && <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Availability</h3>
            </div>
          </CardHeader>
          <CardContent>
            {volunteer.availability.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No availability set</p>
            ) : (
              <div className="space-y-2">
                {daysOfWeek.map((day) => {
                  const slots = volunteer.availability.filter((a) => a.dayOfWeek === day);
                  if (slots.length === 0) return null;
                  return (
                    <div key={day} className="flex items-center gap-3 py-1">
                      <span className="text-sm font-medium text-gray-700 w-24">{dayNames[day]}</span>
                      <div className="flex gap-2 flex-wrap">
                        {slots.map((slot) => (
                          <span key={slot.id} className="text-sm text-gray-500 bg-indigo-50 px-2 py-0.5 rounded">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hours Log */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Hours Log</h3>
            </div>
          </CardHeader>
          <CardContent>
            <form action={logHours} className="space-y-3 mb-6 pb-6 border-b border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <Input name="date" type="date" required label="Date" />
                <Input name="hours" type="number" step="0.25" required label="Hours" placeholder="e.g. 4" />
              </div>
              <Input name="description" placeholder="What did they do?" />
              <select name="departmentId" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Department (optional)</option>
                {volunteer.departments.map((vd) => (
                  <option key={vd.departmentId} value={vd.departmentId}>{vd.department.name}</option>
                ))}
              </select>
              <Button type="submit" size="sm"><Plus className="h-4 w-4 mr-1" /> Log Hours</Button>
            </form>
            <div className="space-y-2">
              {volunteer.hoursLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{log.hours} hours</p>
                    {log.description && <p className="text-xs text-gray-500">{log.description}</p>}
                    <p className="text-xs text-gray-400">{log.date} {log.department && `• ${log.department.name}`}</p>
                  </div>
                  <Badge className={getStatusColor(log.status)}>{log.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Assignments</h3>
            </div>
          </CardHeader>
          <CardContent>
            {volunteer.assignments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No assignments</p>
            ) : (
              <div className="space-y-2">
                {volunteer.assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.title}</p>
                      <p className="text-xs text-gray-500">{a.date} • {a.startTime}-{a.endTime} • {a.department.name}</p>
                    </div>
                    <Badge className={getStatusColor(a.status)}>{a.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Special Considerations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Special Considerations</h3>
            </div>
          </CardHeader>
          <CardContent>
            {volunteer.specialConsiderations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">None recorded</p>
            ) : (
              <div className="space-y-3">
                {volunteer.specialConsiderations.map((sc) => (
                  <div key={sc.id} className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{sc.category}</Badge>
                      {sc.isConfidential && <Badge className="bg-red-100 text-red-800 text-xs">Confidential</Badge>}
                    </div>
                    <p className="text-sm text-gray-700">{sc.description}</p>
                    {sc.accommodations && (
                      <p className="text-sm text-gray-500 mt-1">Accommodations: {sc.accommodations}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
            </div>
          </CardHeader>
          <CardContent>
            {volunteer.activityRecords.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No activities recorded</p>
            ) : (
              <div className="space-y-3">
                {volunteer.activityRecords.map((ar) => (
                  <div key={ar.id} className="flex items-start gap-3 py-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ar.title}</p>
                      {ar.description && <p className="text-xs text-gray-500">{ar.description}</p>}
                      <p className="text-xs text-gray-400">
                        {formatDate(ar.date)} • {ar.type}
                        {ar.department && ` • ${ar.department.name}`}
                      </p>
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
