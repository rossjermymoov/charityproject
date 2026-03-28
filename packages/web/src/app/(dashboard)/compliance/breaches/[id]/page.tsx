import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

export default async function BreachDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const breach = await prisma.dataBreach.findUnique({
    where: { id },
    include: { createdBy: true },
  });

  if (!breach) notFound();

  // Calculate if 72-hour deadline has passed
  const now = new Date();
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const deadlinePassed = breach.discoveredAt < seventyTwoHoursAgo && !breach.icoNotified;

  const severityColors: Record<string, string> = {
    LOW: "bg-green-100 text-green-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
  };

  const statusColors: Record<string, string> = {
    OPEN: "bg-red-100 text-red-800",
    CONTAINED: "bg-orange-100 text-orange-800",
    INVESTIGATING: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-green-100 text-green-800",
  };

  async function notifyICO() {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.dataBreach.update({
      where: { id },
      data: {
        icoNotified: true,
        icoNotifiedAt: new Date(),
      },
    });
    revalidatePath(`/compliance/breaches/${id}`);
  }

  async function updateICOReference(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.dataBreach.update({
      where: { id },
      data: {
        icoReference: (formData.get("icoReference") as string) || null,
      },
    });
    revalidatePath(`/compliance/breaches/${id}`);
  }

  async function notifyDataSubjects() {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.dataBreach.update({
      where: { id },
      data: {
        dataSubjectsNotified: true,
        dataSubjectsNotifiedAt: new Date(),
      },
    });
    revalidatePath(`/compliance/breaches/${id}`);
  }

  async function updateResponse(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.dataBreach.update({
      where: { id },
      data: {
        remediationActions: (formData.get("remediationActions") as string) || null,
        lessonsLearned: (formData.get("lessonsLearned") as string) || null,
      },
    });
    revalidatePath(`/compliance/breaches/${id}`);
  }

  async function updateDPOReview(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.dataBreach.update({
      where: { id },
      data: {
        dpoReview: (formData.get("dpoReview") as string) || null,
      },
    });
    revalidatePath(`/compliance/breaches/${id}`);
  }

  async function updateStatus(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.dataBreach.update({
      where: { id },
      data: {
        status: formData.get("status") as string,
      },
    });
    revalidatePath(`/compliance/breaches/${id}`);
  }

  async function deleteBreach() {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.dataBreach.delete({ where: { id } });
    redirect("/compliance/breaches");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/compliance/breaches" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Breach Details</h1>
      </div>

      {/* Alert if ICO notification overdue */}
      {deadlinePassed && (
        <Card className="border-l-4 border-red-500 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">72-Hour ICO Notification Deadline Passed</h3>
              <p className="text-sm text-red-700 mt-1">
                This breach was discovered more than 72 hours ago and has not been reported to the ICO.
                You must notify the ICO immediately.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Incident Overview */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Incident Overview</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Title</p>
            <p className="text-sm font-medium text-gray-900">{breach.title}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{breach.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Discovered</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(breach.discoveredAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Severity</p>
              <Badge className={severityColors[breach.severity] || "bg-gray-100 text-gray-800"}>
                {breach.severity}
              </Badge>
            </div>
          </div>
          {breach.category && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Category</p>
              <p className="text-sm text-gray-900">{breach.category}</p>
            </div>
          )}
          {breach.cause && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cause</p>
              <p className="text-sm text-gray-900">{breach.cause}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Impact Assessment */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Impact Assessment</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {breach.dataSubjectsAffected && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Data Subjects Affected</p>
              <p className="text-sm font-medium text-gray-900">{breach.dataSubjectsAffected}</p>
            </div>
          )}
          {breach.dataTypesAffected && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Data Types Affected</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{breach.dataTypesAffected}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ICO Notification */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">ICO Notification</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {!breach.icoNotified ? (
            <div>
              <p className="text-sm text-gray-700 mb-4">
                This breach has not been reported to the ICO. If this breach is reportable (affects more than a few individuals
                and involves special categories of data), you must notify the ICO within 72 hours of discovery.
              </p>
              <form action={notifyICO}>
                <Button type="submit" variant="default">
                  Notify ICO
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Notified</p>
                <p className="text-sm font-medium text-green-600 flex items-center gap-2">
                  ✓ {breach.icoNotifiedAt ? formatDate(breach.icoNotifiedAt) : "Yes"}
                </p>
              </div>
              {breach.icoReference && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">ICO Reference</p>
                  <p className="text-sm text-gray-900">{breach.icoReference}</p>
                </div>
              )}
              <form action={updateICOReference} className="space-y-3">
                <Input label="ICO Reference Number" name="icoReference" defaultValue={breach.icoReference || ""} />
                <Button type="submit" size="sm">Save Reference</Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Subject Notification */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Data Subject Notification</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {!breach.dataSubjectsNotified ? (
            <div>
              <p className="text-sm text-gray-700 mb-4">
                Data subjects should be notified in plain language without undue delay.
              </p>
              <form action={notifyDataSubjects}>
                <Button type="submit" variant="default">
                  Mark Data Subjects as Notified
                </Button>
              </form>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Notified</p>
              <p className="text-sm font-medium text-green-600 flex items-center gap-2">
                ✓ {breach.dataSubjectsNotifiedAt ? formatDate(breach.dataSubjectsNotifiedAt) : "Yes"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Response & Lessons Learned</h3>
        </CardHeader>
        <CardContent>
          <form action={updateResponse} className="space-y-4">
            {breach.containmentActions && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Containment Actions</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{breach.containmentActions}</p>
              </div>
            )}
            <Textarea
              label="Remediation Actions"
              name="remediationActions"
              defaultValue={breach.remediationActions || ""}
            />
            <Textarea
              label="Lessons Learned"
              name="lessonsLearned"
              defaultValue={breach.lessonsLearned || ""}
            />
            <Button type="submit" size="sm">Save</Button>
          </form>
        </CardContent>
      </Card>

      {/* DPO Review */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">DPO Review</h3>
        </CardHeader>
        <CardContent>
          <form action={updateDPOReview} className="space-y-4">
            <Textarea
              label="DPO Assessment"
              name="dpoReview"
              defaultValue={breach.dpoReview || ""}
            />
            <Button type="submit" size="sm">Save Assessment</Button>
          </form>
        </CardContent>
      </Card>

      {/* Status Management */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Status Management</h3>
        </CardHeader>
        <CardContent>
          <form action={updateStatus} className="flex gap-3 items-end">
            <div className="flex-1">
              <select
                name="status"
                defaultValue={breach.status}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="OPEN">Open</option>
                <option value="CONTAINED">Contained</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <Button type="submit" size="sm">Update Status</Button>
          </form>
          <div className="mt-4">
            <Badge className={statusColors[breach.status] || "bg-gray-100 text-gray-800"}>
              Current: {breach.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Delete */}
      <div className="flex justify-end gap-3 pt-4">
        <form action={deleteBreach}>
          <Button type="submit" variant="outline" className="text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Breach Record
          </Button>
        </form>
      </div>
    </div>
  );
}
