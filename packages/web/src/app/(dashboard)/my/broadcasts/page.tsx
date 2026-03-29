import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { Radio, CheckCircle, XCircle, HelpCircle, Clock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getStatusColor, formatDate } from "@/lib/utils";

export default async function MyBroadcastsPage() {
  const session = await requireAuth();

  // Find the volunteer profile for this user
  const volunteerProfile = await prisma.volunteerProfile.findFirst({
    where: {
      OR: [
        { userId: session.id },
        { contact: { id: session.contactId || "" } },
      ],
    },
  });

  // Get all open broadcasts (not expired)
  const openBroadcasts = await prisma.broadcast.findMany({
    where: {
      status: "OPEN",
      expiresAt: { gte: new Date() },
    },
    include: {
      department: true,
      skills: { include: { skill: true } },
      createdBy: { select: { name: true } },
      responses: volunteerProfile
        ? { where: { volunteerId: volunteerProfile.id } }
        : { where: { id: "none" } },
    },
    orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
  });

  // Get past broadcasts the volunteer responded to
  const myResponses = volunteerProfile
    ? await prisma.broadcastResponse.findMany({
        where: { volunteerId: volunteerProfile.id },
        include: {
          broadcast: {
            include: {
              department: true,
              skills: { include: { skill: true } },
            },
          },
        },
        orderBy: { respondedAt: "desc" },
        take: 20,
      })
    : [];

  const urgencyOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 };

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
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Broadcasts</h1>
        <p className="text-gray-500 mt-1">Respond to cover requests from your team</p>
      </div>

      {/* Open broadcasts needing response */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Open Requests
          {openBroadcasts.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              {openBroadcasts.length} active
            </span>
          )}
        </h2>

        {openBroadcasts.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No open broadcasts"
            description="There are no active cover requests right now. You'll receive an email when one comes in."
          />
        ) : (
          <div className="space-y-3">
            {openBroadcasts.map((b) => {
              const myResponse = b.responses[0];
              return (
                <Link key={b.id} href={`/broadcasts/${b.id}/respond`}>
                  <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer mb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{b.title}</h3>
                          <Badge className={getStatusColor(b.urgency)}>{b.urgency}</Badge>
                          {myResponse && (
                            <Badge className={
                              myResponse.response === "ACCEPTED" ? "bg-green-100 text-green-800" :
                              myResponse.response === "DECLINED" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {myResponse.response}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{b.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {b.targetDate} • {b.targetStartTime}–{b.targetEndTime}
                          </span>
                          {b.department && <span>{b.department.name}</span>}
                          <span>By {b.createdBy.name}</span>
                        </div>
                        {b.skills.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {b.skills.map((bs) => (
                              <Badge key={bs.skillId} variant="outline" className="text-xs">
                                {bs.skill.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0 mt-1" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Past responses */}
      {myResponses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">My Past Responses</h2>
          <div className="space-y-2">
            {myResponses.map((r) => {
              const Icon = responseIcon[r.response] || HelpCircle;
              return (
                <Link key={r.id} href={`/broadcasts/${r.broadcastId}/respond`}>
                  <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer mb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${responseColor[r.response]}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{r.broadcast.title}</p>
                          <p className="text-xs text-gray-500">
                            {r.response} • {formatDate(r.respondedAt)}
                            {r.confirmedAt && " • Confirmed"}
                            {r.broadcast.status !== "OPEN" && ` • ${r.broadcast.status}`}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(r.broadcast.status)} >
                        {r.broadcast.status}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
