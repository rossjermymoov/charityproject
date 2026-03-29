import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, HelpCircle, Clock, Users, MapPin, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusColor, formatDate } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export default async function BroadcastRespondPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const broadcast = await prisma.broadcast.findUnique({
    where: { id },
    include: {
      department: true,
      skills: { include: { skill: true } },
      createdBy: { select: { name: true } },
    },
  });

  if (!broadcast) notFound();

  // Find the current user's volunteer profile
  const volunteerProfile = await prisma.volunteerProfile.findFirst({
    where: {
      OR: [
        { userId: session.id },
        { contact: { id: session.contactId || "" } },
      ],
    },
  });

  // Check for existing response
  const existingResponse = volunteerProfile
    ? await prisma.broadcastResponse.findFirst({
        where: { broadcastId: id, volunteerId: volunteerProfile.id },
      })
    : null;

  const isExpired = new Date(broadcast.expiresAt) < new Date();
  const isClosed = broadcast.status !== "OPEN";

  // Count how many confirmed so far
  const confirmedCount = await prisma.broadcastResponse.count({
    where: { broadcastId: id, confirmedAt: { not: null } },
  });
  const acceptedCount = await prisma.broadcastResponse.count({
    where: { broadcastId: id, response: "ACCEPTED" },
  });
  const spotsLeft = broadcast.maxRespondents - confirmedCount;

  async function submitResponse(formData: FormData) {
    "use server";
    const sess = await getSession();
    if (!sess) redirect("/login");

    const response = formData.get("response") as string;
    const message = (formData.get("message") as string) || null;
    const broadcastId = formData.get("broadcastId") as string;

    // Find volunteer profile for this user
    const vol = await prisma.volunteerProfile.findFirst({
      where: {
        OR: [
          { userId: sess.id },
          { contact: { id: sess.contactId || "" } },
        ],
      },
    });

    if (!vol) {
      // If no volunteer profile exists but user has a contactId, create one
      if (sess.contactId) {
        const newVol = await prisma.volunteerProfile.create({
          data: {
            contactId: sess.contactId,
            userId: sess.id,
            status: "ACTIVE",
          },
        });
        await upsertResponse(broadcastId, newVol.id, response, message);
      }
      redirect(`/broadcasts/${broadcastId}/respond`);
      return;
    }

    await upsertResponse(broadcastId, vol.id, response, message);
    redirect(`/broadcasts/${broadcastId}/respond`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/broadcasts" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Respond to Broadcast</h1>
      </div>

      {/* Broadcast Details */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900">{broadcast.title}</h2>
            <Badge className={getStatusColor(broadcast.urgency)}>{broadcast.urgency}</Badge>
            {isClosed && <Badge className={getStatusColor(broadcast.status)}>{broadcast.status}</Badge>}
            {isExpired && !isClosed && <Badge className="bg-orange-100 text-orange-800">EXPIRED</Badge>}
          </div>

          <p className="text-gray-600 leading-relaxed">{broadcast.message}</p>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-900">{broadcast.targetDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-sm font-medium text-gray-900">{broadcast.targetStartTime} – {broadcast.targetEndTime}</p>
              </div>
            </div>
            {broadcast.department && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-sm font-medium text-gray-900">{broadcast.department.name}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Volunteers needed</p>
                <p className="text-sm font-medium text-gray-900">
                  {spotsLeft > 0 ? `${spotsLeft} of ${broadcast.maxRespondents} spots left` : "All spots filled"}
                </p>
              </div>
            </div>
          </div>

          {broadcast.skills.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">Skills:</span>
              {broadcast.skills.map((bs) => (
                <Badge key={bs.skillId} variant="outline">{bs.skill.name}</Badge>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400">
            Posted by {broadcast.createdBy.name} • Expires {formatDate(broadcast.expiresAt)}
          </p>
        </CardContent>
      </Card>

      {/* Existing Response */}
      {existingResponse && (
        <Card className={`border-2 ${
          existingResponse.response === "ACCEPTED" ? "border-green-200 bg-green-50" :
          existingResponse.response === "DECLINED" ? "border-red-200 bg-red-50" :
          "border-yellow-200 bg-yellow-50"
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {existingResponse.response === "ACCEPTED" && <CheckCircle className="h-6 w-6 text-green-600" />}
              {existingResponse.response === "DECLINED" && <XCircle className="h-6 w-6 text-red-600" />}
              {existingResponse.response === "TENTATIVE" && <HelpCircle className="h-6 w-6 text-yellow-600" />}
              <div>
                <p className="font-semibold text-gray-900">
                  You responded: {existingResponse.response}
                </p>
                <p className="text-sm text-gray-500">
                  on {formatDate(existingResponse.respondedAt)}
                  {existingResponse.confirmedAt && " — Confirmed by staff"}
                </p>
                {existingResponse.message && (
                  <p className="text-sm text-gray-600 mt-1">"{existingResponse.message}"</p>
                )}
              </div>
            </div>
            {!existingResponse.confirmedAt && !isExpired && !isClosed && (
              <p className="text-sm text-gray-500 mt-3">You can update your response below.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Response Form */}
      {!isExpired && !isClosed ? (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {existingResponse ? "Update Your Response" : "Your Response"}
            </h3>
            <form action={submitResponse} className="space-y-4">
              <input type="hidden" name="broadcastId" value={id} />

              {/* Response buttons */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Can you help?</label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="relative cursor-pointer">
                    <input type="radio" name="response" value="ACCEPTED" required className="peer sr-only" defaultChecked={existingResponse?.response === "ACCEPTED"} />
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 peer-checked:border-green-500 peer-checked:bg-green-50 hover:bg-gray-50 transition-colors">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <span className="font-semibold text-sm text-gray-900">Accept</span>
                      <span className="text-xs text-gray-500 text-center">I can cover this</span>
                    </div>
                  </label>
                  <label className="relative cursor-pointer">
                    <input type="radio" name="response" value="TENTATIVE" className="peer sr-only" defaultChecked={existingResponse?.response === "TENTATIVE"} />
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 peer-checked:border-yellow-500 peer-checked:bg-yellow-50 hover:bg-gray-50 transition-colors">
                      <HelpCircle className="h-8 w-8 text-yellow-600" />
                      <span className="font-semibold text-sm text-gray-900">Maybe</span>
                      <span className="text-xs text-gray-500 text-center">I might be able to</span>
                    </div>
                  </label>
                  <label className="relative cursor-pointer">
                    <input type="radio" name="response" value="DECLINED" className="peer sr-only" defaultChecked={existingResponse?.response === "DECLINED"} />
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 peer-checked:border-red-500 peer-checked:bg-red-50 hover:bg-gray-50 transition-colors">
                      <XCircle className="h-8 w-8 text-red-600" />
                      <span className="font-semibold text-sm text-gray-900">Decline</span>
                      <span className="text-xs text-gray-500 text-center">I can't make it</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-1">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Add a comment (optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="e.g. I can do mornings only, I'll need a lift, etc."
                  defaultValue={existingResponse?.message || ""}
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                {existingResponse ? "Update Response" : "Submit Response"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-6 bg-gray-50 text-center">
          <p className="text-gray-500">
            {isExpired
              ? "This broadcast has expired and is no longer accepting responses."
              : "This broadcast is no longer open for responses."}
          </p>
        </Card>
      )}
    </div>
  );
}

// Helper to upsert a broadcast response
async function upsertResponse(
  broadcastId: string,
  volunteerId: string,
  response: string,
  message: string | null
) {
  const existing = await prisma.broadcastResponse.findFirst({
    where: { broadcastId, volunteerId },
  });

  if (existing) {
    await prisma.broadcastResponse.update({
      where: { id: existing.id },
      data: { response, message, respondedAt: new Date() },
    });
  } else {
    await prisma.broadcastResponse.create({
      data: { broadcastId, volunteerId, response, message: message || undefined },
    });
  }
}
