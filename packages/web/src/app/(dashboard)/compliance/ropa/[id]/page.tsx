import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";

export default async function RopaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const activity = await prisma.processingActivity.findUnique({
    where: { id },
  });

  if (!activity) {
    redirect("/compliance/ropa");
  }

  async function toggleActive() {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const current = await prisma.processingActivity.findUnique({ where: { id } });
    await prisma.processingActivity.update({
      where: { id },
      data: { isActive: !current?.isActive },
    });

    redirect(`/compliance/ropa/${id}`);
  }

  async function updateReview(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.processingActivity.update({
      where: { id },
      data: {
        dpaReference: (formData.get("dpaReference") as string) || null,
        lastReviewDate: formData.get("lastReviewDate")
          ? new Date(formData.get("lastReviewDate") as string)
          : null,
        nextReviewDate: formData.get("nextReviewDate")
          ? new Date(formData.get("nextReviewDate") as string)
          : null,
      },
    });

    redirect(`/compliance/ropa/${id}`);
  }

  async function deleteActivity() {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.processingActivity.delete({
      where: { id },
    });

    redirect("/compliance/ropa");
  }

  const legalBasisColors: Record<string, string> = {
    CONSENT: "bg-blue-100 text-blue-800",
    PUBLIC_TASK: "bg-green-100 text-green-800",
    LEGITIMATE_INTEREST: "bg-purple-100 text-purple-800",
    LEGAL_OBLIGATION: "bg-red-100 text-red-800",
    VITAL_INTEREST: "bg-orange-100 text-orange-800",
    CONTRACT: "bg-indigo-100 text-indigo-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/compliance/ropa">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{activity.name}</h1>
            <p className="text-gray-500 mt-1">Processing activity details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <form action={toggleActive}>
            <Button type="submit" variant="outline" size="sm">
              {activity.isActive ? "Deactivate" : "Activate"}
            </Button>
          </form>
          <form action={deleteActivity}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={(e) => {
                if (!confirm("Are you sure you want to delete this activity?")) {
                  e.preventDefault();
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex gap-2">
        <Badge variant={activity.isActive ? "default" : "outline"}>
          {activity.isActive ? "Active" : "Inactive"}
        </Badge>
        <Badge className={legalBasisColors[activity.legalBasis] || ""}>
          {activity.legalBasis.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Processing Details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Details</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Purpose</p>
            <p className="text-sm text-gray-900 mt-1">{activity.purpose}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Data Controller</p>
            <p className="text-sm text-gray-900 mt-1">{activity.dataController}</p>
          </div>
          {activity.dataProcessor && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Data Processor</p>
              <p className="text-sm text-gray-900 mt-1">{activity.dataProcessor}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Data Categories */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Categories</h2>
        <div className="space-y-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Data Subject Categories</p>
            <p className="text-sm text-gray-900 mt-1">{activity.dataSubjectCategories}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Data Categories</p>
            <p className="text-sm text-gray-900 mt-1">{activity.dataCategories}</p>
          </div>
          {activity.specialCategories && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Special Categories</p>
              <p className="text-sm text-gray-900 mt-1">{activity.specialCategories}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Data Sharing */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Sharing</h2>
        <div className="space-y-6">
          {activity.recipientCategories && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Recipient Categories</p>
              <p className="text-sm text-gray-900 mt-1">{activity.recipientCategories}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">International Transfers</p>
            <p className="text-sm text-gray-900 mt-1">
              {activity.internationalTransfers ? "Yes" : "No"}
            </p>
          </div>
          {activity.transferSafeguards && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Transfer Safeguards</p>
              <p className="text-sm text-gray-900 mt-1">{activity.transferSafeguards}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Security & Retention */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security & Retention</h2>
        <div className="space-y-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Retention Period</p>
            <p className="text-sm text-gray-900 mt-1">{activity.retentionPeriod}</p>
          </div>
          {activity.securityMeasures && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Security Measures</p>
              <p className="text-sm text-gray-900 mt-1">{activity.securityMeasures}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">DPA in Place</p>
            <p className="text-sm text-gray-900 mt-1">
              {activity.dpaInPlace ? (
                <span className="text-green-600 font-semibold">✓ Yes</span>
              ) : (
                <span className="text-gray-500">No</span>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Review Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & DPA Details</h2>
        <form action={updateReview} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DPA Reference</label>
            <input
              name="dpaReference"
              defaultValue={activity.dpaReference || ""}
              placeholder="e.g. DPA-2024-001"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Review Date
              </label>
              <input
                type="date"
                name="lastReviewDate"
                defaultValue={
                  activity.lastReviewDate ? activity.lastReviewDate.toISOString().split("T")[0] : ""
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Review Date
              </label>
              <input
                type="date"
                name="nextReviewDate"
                defaultValue={
                  activity.nextReviewDate ? activity.nextReviewDate.toISOString().split("T")[0] : ""
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <Button type="submit">Save Changes</Button>
        </form>
      </Card>
    </div>
  );
}
