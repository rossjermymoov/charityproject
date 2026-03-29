import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sendBroadcastNotifications } from "@/lib/broadcast-sender";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, HelpCircle, Send, RotateCcw, Trash2, Users } from "lucide-react";
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
      include: { volunteer: { include: { contact: true } } },
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

  async function reactivateBroadcast() {
    "use server";
    await prisma.broadcast.update({
      where: { id },
      data: {
        status: "OPEN",
        filledAt: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    redirect(`/broadcasts/${id}`);
  }

  async function resendBroadcast() {
    "use server";
    const bc = await prisma.broadcast.findUnique({
      where: { id },
      include: {
        department: true,
        skills: { include: { skill: true } },
        createdBy: true,
      },
    });
    if (!bc) return;

    if (bc.status !== "OPEN") {
      await prisma.broadcast.update({
        where: { id },
        data: {
          status: "OPEN",
          filledAt: null,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    sendBroadcastNotifications(bc).catch((err: unknown) =>
      console.error("[broadcast] Resend failed:", err)
    );

    redirect(`/broadcasts/${id}`);
  }

  async function deleteBroadcast() {
    "use server";
    await prisma.broadcastResponse.deleteMany({ where: { broadcastId: id } });
    await prisma.broadcastSkill.deleteMany({ where: { broadcastId: id } });
    await prisma.broadcast.delete({ where: { id } });
    redirect("/broadcasts");
  }

  const accepted = broadcast.responses.filter((r) => r.response === "ACCEPTED");
  const declined = broadcast.responses.filter((r) => r.response === "DECLINED");
  const tentative = broadcast.responses.filter((r) => r.response === "TENTATIVE");
  const confirmed = broadcast.responses.filter((r) => r.confirmedAt);

  const isOpen = broadcast.status === "OPEN";
  const isCancelled = broadcast.status === "CANCELLED";
  const isFilled = broadcast.status === "FILLED";
  const isExpired = new Date(broadcast.expiresAt) < new Date();
  const canReactivate = isCancelled || isFilled || (isExpired && isOpen);

  const spotsTotal = broadcast.maxRespondents;
  // accepted already includes confirmed (confirmed is a subset of accepted)
  const spotsFilled = accepted.length;
  const spotsRemaining = Math.max(0, spotsTotal - spotsFilled);
  const progressPct = Math.min(100, Math.round((spotsFilled / spotsTotal) * 100));

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

      {/* ====== HERO SPOTS BANNER ====== */}
      {/* Red = 0 replies, Amber = partial, Green = full */}
      <div className={`rounded-2xl overflow-hidden ${
        spotsFilled >= spotsTotal
          ? "bg-gradient-to-br from-green-500 to-emerald-600"
          : spotsFilled > 0
          ? "bg-gradient-to-br from-amber-500 to-orange-600"
          : "bg-gradient-to-br from-red-500 to-rose-600"
      } text-white shadow-lg`}>
        <div className="px-8 pt-8 pb-6">
          {/* Big number display */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-1">
                {spotsFilled >= spotsTotal ? "Broadcast" : spotsFilled > 0 ? "Almost there" : "Volunteers needed"}
              </p>
              <h2 className="text-4xl font-extrabold leading-tight">
                {spotsFilled >= spotsTotal ? (
                  "All Spots Filled!"
                ) : spotsRemaining === 1 ? (
                  "1 More Person Needed!"
                ) : (
                  <>{spotsRemaining} More People Needed</>
                )}
              </h2>
              <p className="text-white/80 text-lg mt-1">
                {spotsFilled >= spotsTotal
                  ? `${spotsTotal} of ${spotsTotal} volunteers secured`
                  : `${spotsFilled} of ${spotsTotal} ${spotsFilled === 1 ? "has" : "have"} stepped up`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-7xl font-black tabular-nums leading-none">
                {spotsFilled}<span className="text-4xl text-white/50">/{spotsTotal}</span>
              </div>
            </div>
          </div>

          {/* Progress bar — thick and bold */}
          <div className="mt-6 w-full bg-white/20 rounded-full h-5 overflow-hidden">
            <div
              className="bg-white h-5 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Slot circles */}
          <div className="flex gap-3 mt-5 justify-center">
            {Array.from({ length: spotsTotal }).map((_, i) => {
              const isConfirmed = i < confirmed.length;
              const isAccepted = !isConfirmed && i < confirmed.length + (accepted.length - confirmed.length);
              const isTentative = !isConfirmed && !isAccepted && i < confirmed.length + accepted.length - confirmed.length + tentative.length;
              const filled = isConfirmed || isAccepted;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all ${
                    isConfirmed
                      ? "bg-white border-white"
                      : isAccepted
                      ? "bg-white/80 border-white/80"
                      : isTentative
                      ? "bg-white/30 border-white/40"
                      : "bg-transparent border-white/30 border-dashed"
                  }`}>
                    {isConfirmed ? (
                      <CheckCircle className="h-7 w-7 text-green-600" />
                    ) : isAccepted ? (
                      <CheckCircle className="h-7 w-7 text-indigo-600" />
                    ) : isTentative ? (
                      <HelpCircle className="h-6 w-6 text-white/70" />
                    ) : (
                      <Users className="h-6 w-6 text-white/30" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-white/70">
                    {isConfirmed ? "Confirmed" : isAccepted ? "Accepted" : isTentative ? "Maybe" : "Open"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom stats strip */}
        <div className="bg-black/10 px-8 py-3 flex items-center justify-between text-sm">
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" /> {accepted.length} accepted
            </span>
            {tentative.length > 0 && (
              <span className="flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4" /> {tentative.length} maybe
              </span>
            )}
            {declined.length > 0 && (
              <span className="flex items-center gap-1.5 text-white/60">
                <XCircle className="h-4 w-4" /> {declined.length} declined
              </span>
            )}
          </div>
          {confirmed.length > 0 && (
            <span className="font-semibold">{confirmed.length} confirmed</span>
          )}
        </div>
      </div>

      {/* Broadcast Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{broadcast.title}</h2>
                <Badge className={getStatusColor(broadcast.urgency)}>{broadcast.urgency}</Badge>
                <Badge className={getStatusColor(broadcast.status)}>{broadcast.status}</Badge>
                {isExpired && isOpen && (
                  <Badge className="bg-orange-100 text-orange-800">EXPIRED</Badge>
                )}
              </div>
              <p className="text-gray-600 mt-2">{broadcast.message}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>Date: {broadcast.targetDate}</span>
                <span>Time: {broadcast.targetStartTime} - {broadcast.targetEndTime}</span>
                {broadcast.department && <span>Dept: {broadcast.department.name}</span>}
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

            {/* Action buttons */}
            <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
              {isOpen && !isExpired && (
                <>
                  <form action={resendBroadcast}>
                    <Button variant="outline" size="sm" className="w-full gap-1">
                      <Send className="h-3.5 w-3.5" /> Resend
                    </Button>
                  </form>
                  <form action={cancelBroadcast}>
                    <Button variant="destructive" size="sm" className="w-full">Cancel</Button>
                  </form>
                </>
              )}
              {canReactivate && (
                <form action={reactivateBroadcast}>
                  <Button size="sm" className="w-full gap-1 bg-indigo-600 hover:bg-indigo-700">
                    <RotateCcw className="h-3.5 w-3.5" /> Reactivate
                  </Button>
                </form>
              )}
              <form action={deleteBroadcast} className="mt-1">
                <Button variant="outline" size="sm" className="w-full gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

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
