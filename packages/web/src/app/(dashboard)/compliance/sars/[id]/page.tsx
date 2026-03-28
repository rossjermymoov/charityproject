import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Trash2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

export default async function SARDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sar = await prisma.subjectAccessRequest.findUnique({
    where: { id },
    include: {
      assignedTo: true,
      createdBy: true,
    },
  });

  if (!sar) notFound();

  const matchedContact = sar.contactId
    ? await prisma.contact.findUnique({ where: { id: sar.contactId } })
    : null;

  // Get users for assignment dropdown
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // Calculate days remaining
  const now = new Date();
  const daysRemaining = Math.ceil((sar.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isPastDue = sar.dueDate < now && sar.status !== "SENT" && sar.status !== "CLOSED" && sar.status !== "REFUSED";

  const statusColors: Record<string, string> = {
    RECEIVED: "bg-blue-100 text-blue-800",
    VERIFIED: "bg-indigo-100 text-indigo-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    READY: "bg-orange-100 text-orange-800",
    SENT: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-800",
    REFUSED: "bg-red-100 text-red-800",
  };

  async function verifyIdentity() {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.subjectAccessRequest.update({
      where: { id },
      data: {
        idVerified: true,
        idVerifiedAt: new Date(),
      },
    });
    revalidatePath(`/compliance/sars/${id}`);
  }

  async function assignToStaff(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const assignedToId = formData.get("assignedToId") as string;
    await prisma.subjectAccessRequest.update({
      where: { id },
      data: {
        assignedToId: assignedToId || null,
      },
    });
    revalidatePath(`/compliance/sars/${id}`);
  }

  async function updateStatus(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.subjectAccessRequest.update({
      where: { id },
      data: {
        status: formData.get("status") as string,
      },
    });
    revalidatePath(`/compliance/sars/${id}`);
  }

  async function applyExtension(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const currentSar = await prisma.subjectAccessRequest.findUnique({ where: { id } });
    const newDueDate = new Date(currentSar!.dueDate);
    newDueDate.setMonth(newDueDate.getMonth() + 2);

    await prisma.subjectAccessRequest.update({
      where: { id },
      data: {
        extensionApplied: true,
        extensionReason: formData.get("extensionReason") as string,
        dueDate: newDueDate,
      },
    });
    revalidatePath(`/compliance/sars/${id}`);
  }

  async function updateResponse(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.subjectAccessRequest.update({
      where: { id },
      data: {
        responseNotes: (formData.get("responseNotes") as string) || null,
      },
    });
    revalidatePath(`/compliance/sars/${id}`);
  }

  async function markAsSent(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.subjectAccessRequest.update({
      where: { id },
      data: {
        dataSentAt: new Date(),
        dataSentMethod: formData.get("dataSentMethod") as string,
        status: "SENT",
      },
    });
    revalidatePath(`/compliance/sars/${id}`);
  }

  async function refuseRequest(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const refusalReason = formData.get("refusalReason") as string;
    if (!refusalReason) return;

    await prisma.subjectAccessRequest.update({
      where: { id },
      data: {
        status: "REFUSED",
        refusalReason,
      },
    });
    revalidatePath(`/compliance/sars/${id}`);
  }

  async function deleteSAR() {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.subjectAccessRequest.delete({ where: { id } });
    redirect("/compliance/sars");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/compliance/sars" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">SAR Details</h1>
      </div>

      {/* Request Details */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Request Details</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Requester Name</p>
              <p className="text-sm font-medium text-gray-900">{sar.requesterName}</p>
            </div>
            {sar.requesterEmail && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm text-gray-900">{sar.requesterEmail}</p>
              </div>
            )}
            {sar.requesterPhone && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                <p className="text-sm text-gray-900">{sar.requesterPhone}</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Request Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(sar.requestDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Due Date</p>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${isPastDue ? "text-red-600" : "text-gray-900"}`}>
                  {formatDate(sar.dueDate)}
                </p>
                {isPastDue && (
                  <Badge className="bg-red-100 text-red-800">Past Due</Badge>
                )}
              </div>
            </div>
          </div>
          {daysRemaining > 0 && !isPastDue && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Days Remaining</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <p className="text-sm font-medium text-gray-900">{daysRemaining} days</p>
              </div>
            </div>
          )}
          {sar.description && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{sar.description}</p>
            </div>
          )}
          {matchedContact && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Matched Contact</p>
              <Link
                href={`/crm/contacts/${matchedContact.id}`}
                className="text-sm text-indigo-600 hover:underline"
              >
                {matchedContact.firstName} {matchedContact.lastName}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Section */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Workflow</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Verify Identity */}
          <div className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Identity Verification</p>
                <p className="text-xs text-gray-500 mt-1">
                  {sar.idVerified ? `Verified on ${formatDate(sar.idVerifiedAt!)}` : "Not yet verified"}
                </p>
              </div>
              {!sar.idVerified && (
                <form action={verifyIdentity}>
                  <Button type="submit" size="sm">Verify Identity</Button>
                </form>
              )}
            </div>
          </div>

          {/* Assign to Staff */}
          <div className="border-b border-gray-100 pb-4">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-3">Assign To Staff Member</p>
              <form action={assignToStaff} className="flex gap-2">
                <select
                  name="assignedToId"
                  defaultValue={sar.assignedToId || ""}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm">Assign</Button>
              </form>
              {sar.assignedTo && (
                <p className="text-xs text-gray-500 mt-2">Currently assigned to: {sar.assignedTo.name}</p>
              )}
            </div>
          </div>

          {/* Status Update */}
          <div>
            <p className="text-sm font-medium text-gray-900 mb-3">Status</p>
            <form action={updateStatus} className="flex gap-2">
              <select
                name="status"
                defaultValue={sar.status}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="RECEIVED">Received</option>
                <option value="VERIFIED">Verified</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="READY">Ready</option>
                <option value="SENT">Sent</option>
                <option value="CLOSED">Closed</option>
                <option value="REFUSED">Refused</option>
              </select>
              <Button type="submit" size="sm">Update</Button>
            </form>
            <div className="mt-2">
              <Badge className={statusColors[sar.status] || "bg-gray-100 text-gray-800"}>
                {sar.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extension Section */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Extension</h3>
        </CardHeader>
        <CardContent>
          {!sar.extensionApplied ? (
            <form action={applyExtension} className="space-y-4">
              <Textarea
                label="Extension Reason"
                name="extensionReason"
                placeholder="Why is this SAR complex and requires an extension? (You can request up to 2 additional months)"
                required
              />
              <Button type="submit">Apply 2-Month Extension</Button>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Extension Applied</p>
                <Badge className="bg-orange-100 text-orange-800">Yes</Badge>
              </div>
              {sar.extensionReason && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reason</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{sar.extensionReason}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">New Due Date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(sar.dueDate)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Section */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Response</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={updateResponse} className="space-y-4">
            <Textarea
              label="Response Notes"
              name="responseNotes"
              defaultValue={sar.responseNotes || ""}
              placeholder="Document the data provided and any redactions made..."
            />
            <Button type="submit" size="sm">Save Notes</Button>
          </form>

          {sar.status !== "SENT" && sar.status !== "CLOSED" && sar.status !== "REFUSED" && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <form action={markAsSent} className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    How was the data sent?
                  </label>
                  <select
                    name="dataSentMethod"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select method...</option>
                    <option value="EMAIL">Email</option>
                    <option value="POST">Post</option>
                    <option value="PORTAL">Secure Portal</option>
                  </select>
                </div>
                <Button type="submit">Mark as Sent</Button>
              </form>
            </div>
          )}

          {sar.dataSentAt && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sent</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(sar.dataSentAt)} via {sar.dataSentMethod}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refusal Section */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Refusal</h3>
        </CardHeader>
        <CardContent>
          {sar.status === "REFUSED" ? (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Refusal Reason</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{sar.refusalReason}</p>
            </div>
          ) : (
            <form action={refuseRequest} className="space-y-4">
              <Textarea
                label="Refusal Reason"
                name="refusalReason"
                placeholder="Provide the valid exemption reason (e.g., trade secrets, legal privilege)"
                required
              />
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
                Refuse Request
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Delete */}
      <div className="flex justify-end gap-3 pt-4">
        <form action={deleteSAR}>
          <Button type="submit" variant="outline" className="text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete SAR
          </Button>
        </form>
      </div>
    </div>
  );
}
