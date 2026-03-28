import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Radio, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getStatusColor, formatDate } from "@/lib/utils";

export default async function BroadcastsPage() {
  const broadcasts = await prisma.broadcast.findMany({
    include: {
      department: true,
      skills: { include: { skill: true } },
      responses: { include: { volunteer: { include: { contact: true } } } },
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Broadcasts</h1>
          <p className="text-gray-500 mt-1">Send urgent cover requests to volunteers</p>
        </div>
        <Link href="/dashboard/broadcasts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Broadcast
          </Button>
        </Link>
      </div>

      {broadcasts.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No broadcasts yet"
          description="Create a broadcast when you need urgent volunteer cover."
          actionLabel="New Broadcast"
          actionHref="/dashboard/broadcasts/new"
        />
      ) : (
        <div className="space-y-4">
          {broadcasts.map((b) => {
            const accepted = b.responses.filter((r) => r.response === "ACCEPTED").length;
            const declined = b.responses.filter((r) => r.response === "DECLINED").length;
            const tentative = b.responses.filter((r) => r.response === "TENTATIVE").length;

            return (
              <Link key={b.id} href={`/dashboard/broadcasts/${b.id}`}>
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer mb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">{b.title}</h3>
                        <Badge className={getStatusColor(b.urgency)}>{b.urgency}</Badge>
                        <Badge className={getStatusColor(b.status)}>{b.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{b.message}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                        <span>{b.targetDate} • {b.targetStartTime}-{b.targetEndTime}</span>
                        {b.department && <span>{b.department.name}</span>}
                        <span>By {b.createdBy.name}</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {b.skills.map((bs) => (
                          <Badge key={bs.skillId} variant="outline" className="text-xs">
                            {bs.skill.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {b.responses.length} response{b.responses.length !== 1 ? "s" : ""}
                      </p>
                      <div className="flex gap-2 mt-1 justify-end">
                        {accepted > 0 && <span className="text-xs text-green-600">{accepted} accepted</span>}
                        {tentative > 0 && <span className="text-xs text-yellow-600">{tentative} tentative</span>}
                        {declined > 0 && <span className="text-xs text-red-600">{declined} declined</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Need {b.maxRespondents}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
