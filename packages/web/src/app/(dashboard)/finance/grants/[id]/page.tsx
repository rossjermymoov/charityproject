import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Trash2, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { PipelineTimeline, getGrantSteps } from "@/components/ui/pipeline-timeline";

export default async function GrantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const grant = await prisma.grant.findUnique({
    where: { id },
    include: {
      createdBy: true,
      funder: true,
    },
  });

  if (!grant) notFound();

  async function updateGrantStatus(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const currentGrant = await prisma.grant.findUnique({ where: { id } });
    if (!currentGrant) return;

    const status = formData.get("status") as string;
    const updateData: any = { status };

    // Update date fields based on status changes
    if (status === "SUBMITTED" && !currentGrant.submittedDate) {
      updateData.submittedDate = new Date();
    }
    if (status === "SUCCESSFUL" && !currentGrant.decisionDate) {
      updateData.decisionDate = new Date();
    }
    if (status === "UNSUCCESSFUL" && !currentGrant.decisionDate) {
      updateData.decisionDate = new Date();
    }
    if (status === "REPORTING" && !currentGrant.startDate) {
      updateData.startDate = new Date();
    }

    await prisma.grant.update({
      where: { id },
      data: updateData,
    });

    revalidatePath(`/finance/grants/${id}`);
  }

  async function updateGrantDetails(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const amountRequested = formData.get("amountRequested") as string;
    const amountAwarded = formData.get("amountAwarded") as string;
    const applicationDeadline = formData.get("applicationDeadline") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const reportingDeadline = formData.get("reportingDeadline") as string;

    await prisma.grant.update({
      where: { id },
      data: {
        title: formData.get("title") as string,
        funderName: formData.get("funderName") as string,
        type: formData.get("type") as string,
        description: (formData.get("description") as string) || null,
        purpose: (formData.get("purpose") as string) || null,
        conditions: (formData.get("conditions") as string) || null,
        contactPerson: (formData.get("contactPerson") as string) || null,
        contactEmail: (formData.get("contactEmail") as string) || null,
        reference: (formData.get("reference") as string) || null,
        amountRequested: amountRequested ? parseFloat(amountRequested) : null,
        amountAwarded: amountAwarded ? parseFloat(amountAwarded) : null,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        reportingDeadline: reportingDeadline ? new Date(reportingDeadline) : null,
        notes: (formData.get("notes") as string) || null,
      },
    });

    revalidatePath(`/finance/grants/${id}`);
  }

  async function deleteGrant() {
    "use server";
    const session = await requireAuth();

    await prisma.grant.delete({
      where: { id },
    });

    revalidatePath("/finance/grants");
    redirect("/finance/grants");
  }

  const statusColors: Record<string, string> = {
    IDENTIFIED: "bg-blue-100 text-blue-800",
    RESEARCHING: "bg-blue-100 text-blue-800",
    APPLYING: "bg-yellow-100 text-yellow-800",
    SUBMITTED: "bg-yellow-100 text-yellow-800",
    SUCCESSFUL: "bg-purple-100 text-purple-800",
    UNSUCCESSFUL: "bg-red-100 text-red-800",
    REPORTING: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-100 text-gray-800",
  };

  const typeOptions = [
    { value: "TRUST", label: "Trust" },
    { value: "FOUNDATION", label: "Foundation" },
    { value: "GOVERNMENT", label: "Government" },
    { value: "CORPORATE", label: "Corporate" },
    { value: "LOTTERY", label: "Lottery" },
    { value: "OTHER", label: "Other" },
  ];

  const statusOptions = [
    { value: "IDENTIFIED", label: "Identified" },
    { value: "RESEARCHING", label: "Researching" },
    { value: "APPLYING", label: "Applying" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "SUCCESSFUL", label: "Successful" },
    { value: "UNSUCCESSFUL", label: "Unsuccessful" },
    { value: "REPORTING", label: "Reporting" },
    { value: "COMPLETED", label: "Completed" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/grants" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Grant Details</h1>
      </div>

      {/* Visual Pipeline Timeline */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Grant Pipeline</h3>
        </CardHeader>
        <CardContent>
          <PipelineTimeline
            steps={getGrantSteps(grant)}
            currentStepKey={grant.status === "UNSUCCESSFUL" ? "SUBMITTED" : grant.status}
            variant="grant"
            size="full"
          />
          {grant.status === "UNSUCCESSFUL" && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-sm text-red-700 font-medium">This grant application was unsuccessful</p>
              {grant.decisionDate && (
                <p className="text-xs text-red-500 mt-1">Decision: {formatDate(grant.decisionDate)}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Title</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{grant.title}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Funder</p>
                <p className="text-sm text-gray-900 mt-1">{grant.funderName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type</p>
                <p className="text-sm text-gray-900 mt-1">{grant.type}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
                <div className="mt-1">
                  <Badge className={statusColors[grant.status]}>{grant.status}</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Awarded Amount</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {grant.amountAwarded
                    ? `£${grant.amountAwarded.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Amount</p>
                <p className="text-sm text-gray-900 mt-1">
                  {grant.amountRequested
                    ? `£${grant.amountRequested.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {grant.description && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</p>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{grant.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Status */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
        </CardHeader>
        <CardContent>
          <form action={updateGrantStatus} className="space-y-4">
            <Select
              label="Status"
              name="status"
              required
              defaultValue={grant.status}
              options={statusOptions}
            />
            <Button type="submit">Update Status</Button>
          </form>
        </CardContent>
      </Card>

      {/* Edit Details */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Edit Grant Details</h3>
        </CardHeader>
        <CardContent>
          <form action={updateGrantDetails} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Title"
                name="title"
                required
                defaultValue={grant.title}
              />
              <Input
                label="Funder Name"
                name="funderName"
                required
                defaultValue={grant.funderName}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Type"
                name="type"
                required
                defaultValue={grant.type}
                options={typeOptions}
              />
              <Input
                label="Reference"
                name="reference"
                placeholder="e.g. grant reference number"
                defaultValue={grant.reference || ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount Requested"
                name="amountRequested"
                type="number"
                step="0.01"
                placeholder="£0.00"
                defaultValue={grant.amountRequested || ""}
              />
              <Input
                label="Amount Awarded"
                name="amountAwarded"
                type="number"
                step="0.01"
                placeholder="£0.00"
                defaultValue={grant.amountAwarded || ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Application Deadline"
                name="applicationDeadline"
                type="date"
                defaultValue={grant.applicationDeadline ? grant.applicationDeadline.toISOString().split("T")[0] : ""}
              />
              <Input
                label="Reporting Deadline"
                name="reportingDeadline"
                type="date"
                defaultValue={grant.reportingDeadline ? grant.reportingDeadline.toISOString().split("T")[0] : ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                name="startDate"
                type="date"
                defaultValue={grant.startDate ? grant.startDate.toISOString().split("T")[0] : ""}
              />
              <Input
                label="End Date"
                name="endDate"
                type="date"
                defaultValue={grant.endDate ? grant.endDate.toISOString().split("T")[0] : ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Contact Person"
                name="contactPerson"
                placeholder="Grant contact name"
                defaultValue={grant.contactPerson || ""}
              />
              <Input
                label="Contact Email"
                name="contactEmail"
                type="email"
                placeholder="contact@funder.org"
                defaultValue={grant.contactEmail || ""}
              />
            </div>

            <Input
              label="Description"
              name="description"
              placeholder="Grant description and overview..."
              defaultValue={grant.description || ""}
            />

            <Input
              label="Purpose"
              name="purpose"
              placeholder="How the grant will be used..."
              defaultValue={grant.purpose || ""}
            />

            <Input
              label="Conditions"
              name="conditions"
              placeholder="Grant conditions and restrictions..."
              defaultValue={grant.conditions || ""}
            />

            <Input
              label="Notes"
              name="notes"
              placeholder="Additional notes..."
              defaultValue={grant.notes || ""}
            />

            <Button type="submit">
              <Edit2 className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/finance/grants">
          <Button variant="outline">Back</Button>
        </Link>
        <form action={deleteGrant}>
          <ConfirmButton message="Are you sure you want to delete this grant?" variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
