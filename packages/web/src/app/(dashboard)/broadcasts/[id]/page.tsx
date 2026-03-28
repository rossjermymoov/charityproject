import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getStatusColor, formatDate } from "@/lib/utils";

export default async function BroadcastDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const broadcast = await prisma.broadcast.findUnique({
    where: { id },
    include: {
      department: true,
      skills: { include: { skill: true } },
      createdBy: true,
      responses: {
        include: {
          volunteer: { include: { contact: true } },
          confirmedBy: true,
        },
        orderBy: { respondedAt: "desc" },
      },
    },
  });

  if (!broadcast) notFound();

  async function confirmVolunteer(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const responseId = formData.get("responseId") as string;
    const response = await prisma.broadcastResponse.update({
      where: { id: responseId },
      data: { confirmedById: session.id, confirmedAt: new Date() },
      include: { volunteer: true },
    });

    // Check if we've filled all spots
    const confirmedCount = await prisma.broadcastResponse.count({
      where: { broadcastId: id, confirmedAt: { not: null } },
    });

    const bc = await prisma.broadcast.findUnique({ where: { id } });
    if (bc && confirmedCount >= bc.maxRespondents) {
      await prisma.broadcast.update({
        where: { id },
        data: { status: "FILLED", filledAt: new Date() },
      });
    }

    // Create assignment for the confirmed volunteer
    const dept = await prisma.broadcast.findUnique({ where: { id }, select: { departmentId: true, targetDate: true, targetStartTime: true, targetEndTime: true, title: true } });
    if (dept?.departmentId) {
      await prisma.assignment.create({
        data: {
          volunteerId: response.volunteerId,
          departmentId: dept.departmentId,
          title: `Cover: ${dept.title}`,
          date: dept.targetDate,
          startTime: dept.targetStartTime,
          endTime: dept.targetEndTime,
          status: "CONFIRMED",
          createdById: session.id,
        },
      });
    }

    redirect(`/broadcasts/${id}`);
  }

  async function cancelBroadcast() {
    "use server";
    await prisma.broadcast.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    redirect(`/broadcasts/${id}`);
  }

  const accepted = broadcast.responses.filter((r) => r.response === "ACCEPTED");
  const declined = broadcast.responses.filter((r) => r.response === "DECLINED");
  const tentative = broadcast.responses.filter((r) => r.response === "TENTATIVE");
  const confirmed = broadcast.responses.filter((r) => r.confirmedAt);

  const responseIcon: Record<string, typeof CheckCircle> = {
    ACCEPTED: CheckCircle,
    DECLINED: XCircle,
    TENTATIVE: HelpCircle,
  };

  const responseColor: Record<string, string> = {
    ACCEPTED: "text-green-600",
    DECLINED: "text-red-600",
    TENTATIVE: "text-yellow-600",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/broadcasts" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Broadcast Details</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{broadcast.title}</h2>
                <Badge className={getStatusColor(broadcast.urgency)}>{broadcast.urgency}</Badge>
                <Badge className={getStatusColor(broadcast.status)}>{broadcast.status}</Badge>
              </div>
              <p className="text-gray-600 mt-2">{broadcast.message}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>Date: {broadcast.targetDate}</span>
                <span>Time: {broadcast.targetStartTime} - {broadcast.targetEndTime}</span>
                {broadcast.department && <span>Dept: {broadcast.department.name}</span>}
                <span>Need: {broadcast.maxRespondents} people</span>
              </div>
              <div className="flex gap-1 mt-2">
                {broadcast.skills.map((bs) => (
                  <Badge key={bs.skillId} variant="outline">{bs.skill.name}</Badge>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Created by {broadcast.createdBy.name} • {formatDate(broadcast.createdAt)} • Expires {formatDate(broadcast.expiresAt)}
              </p>
            </div>
            {broadcast.status === "OPEN" && (
              <form action={cancelBroadcast}>
                <Button variant="destructive" size="sm">Cancel Broadcast</Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Response Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{broadcast.responses.length}</p>
          <p className="text-sm text-gray-500">Total Responses</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{accepted.length}</p>
          <p className="text-sm text-gray-500">Accepted</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{tentative.length}</p>
          <p className="text-sm text-gray-500">Tentative</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{confirmed.length}</p>
          <p className="text-sm text-gray-500">Confirmed</p>
        </Card>
      </div>

      {/* Responses */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Responses</h3>
        </CardHeader>
        <CardContent>
          {broadcast.responses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No responses yet. Waiting for volunteers...</p>
          ) : (
            <div className="space-y-3">
              {broadcast.responses.map((r) => {
                const Icon = responseIcon[r.response] || HelpCircle;
                return (
                  <div key={r.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${responseColor[r.response]}`} />
                      <Avatar
                        firstName={r.volunteer.contact.firstName}
                        lastName={r.volunteer.contact.lastName}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {r.volunteer.contact.firstName} {r.volunteer.contact.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {r.response} • {formatDate(r.respondedAt)}
                          {r.message && ` • "${r.message}"`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.confirmedAt ? (
                        <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
                      ) : (
                        r.response === "ACCEPTED" && broadcast.status === "OPEN" && (
                          <form action={confirmVolunteer}>
                            <input type="hidden" name="responseId" value={r.id} />
                            <Button size="sm">Confirm</Button>
                          </form>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
