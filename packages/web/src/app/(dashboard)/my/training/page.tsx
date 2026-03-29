import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function MyTrainingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.contactId) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
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
        <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">No Volunteer Profile</h2>
        <p className="text-gray-500 mt-2">You don&apos;t have a volunteer profile set up yet.</p>
      </div>
    );
  }

  const training = await prisma.volunteerTraining.findMany({
    where: { volunteerId: volunteer.id },
    orderBy: { completedDate: "desc" },
    include: { course: true },
  });

  const completed = training.filter((t) => t.status === "COMPLETED");
  const expiringSoon = training.filter((t) => {
    if (!t.expiryDate || t.status !== "COMPLETED") return false;
    const daysUntil = (new Date(t.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntil > 0 && daysUntil <= 30;
  });
  const expired = training.filter((t) => {
    if (!t.expiryDate) return false;
    return new Date(t.expiryDate) < new Date();
  });

  const statusColors: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    NOT_STARTED: "bg-gray-100 text-gray-800",
    EXPIRED: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Training</h1>
        <p className="text-gray-500 mt-1">Your training courses and certifications</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-600">{completed.length}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-amber-600">{expiringSoon.length}</p>
            <p className="text-sm text-gray-500">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-red-600">{expired.length}</p>
            <p className="text-sm text-gray-500">Expired</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(expiringSoon.length > 0 || expired.length > 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                {expired.length > 0 && (
                  <p className="text-sm text-amber-800 font-medium">
                    {expired.length} training course{expired.length > 1 ? "s have" : " has"} expired and need{expired.length > 1 ? "" : "s"} renewing.
                  </p>
                )}
                {expiringSoon.length > 0 && (
                  <p className="text-sm text-amber-700 mt-1">
                    {expiringSoon.length} course{expiringSoon.length > 1 ? "s" : ""} expiring within 30 days.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Training Record</h2>
        </CardHeader>
        <CardContent>
          {training.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No training records yet</p>
          ) : (
            <div className="space-y-3">
              {training.map((t) => {
                const isExpired = t.expiryDate && new Date(t.expiryDate) < new Date();
                return (
                  <div key={t.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{t.course.name}</h3>
                        {t.course.description && (
                          <p className="text-sm text-gray-500">{t.course.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {t.completedDate && (
                            <span>Completed: {formatDate(t.completedDate)}</span>
                          )}
                          {t.expiryDate && (
                            <span className={isExpired ? "text-red-600 font-medium" : ""}>
                              {isExpired ? "Expired" : "Expires"}: {formatDate(t.expiryDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className={
                        isExpired
                          ? "bg-red-100 text-red-800"
                          : statusColors[t.status] || ""
                      }>
                        {isExpired ? "EXPIRED" : t.status}
                      </Badge>
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
