import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { ConfirmButton } from "@/components/ui/confirm-button";

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const asset = await prisma.informationAsset.findUnique({
    where: { id },
  });

  if (!asset) {
    redirect("/compliance/assets");
  }

  async function updateAsset(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.informationAsset.update({
      where: { id },
      data: {
        lastReviewDate: formData.get("lastReviewDate")
          ? new Date(formData.get("lastReviewDate") as string)
          : null,
        nextReviewDate: formData.get("nextReviewDate")
          ? new Date(formData.get("nextReviewDate") as string)
          : null,
        notes: (formData.get("notes") as string) || null,
      },
    });

    redirect(`/compliance/assets/${id}`);
  }

  async function deleteAsset() {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.informationAsset.delete({
      where: { id },
    });

    redirect("/compliance/assets");
  }

  const assetTypeColors: Record<string, string> = {
    DATABASE: "bg-blue-100 text-blue-800",
    FILE_SYSTEM: "bg-yellow-100 text-yellow-800",
    CLOUD_SERVICE: "bg-purple-100 text-purple-800",
    PAPER: "bg-gray-100 text-gray-800",
    APPLICATION: "bg-green-100 text-green-800",
    EMAIL: "bg-indigo-100 text-indigo-800",
  };

  const classificationColors: Record<string, string> = {
    OFFICIAL: "bg-gray-100 text-gray-800",
    OFFICIAL_SENSITIVE: "bg-orange-100 text-orange-800",
    SECRET: "bg-red-100 text-red-800",
  };

  const riskColors: Record<string, string> = {
    LOW: "bg-green-100 text-green-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/compliance/assets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
            <p className="text-gray-500 mt-1">Information asset details</p>
          </div>
        </div>
        <form action={deleteAsset}>
          <ConfirmButton
            message="Are you sure you want to delete this asset?"
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </ConfirmButton>
        </form>
      </div>

      {/* Badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge className={assetTypeColors[asset.assetType] || ""}>
          {asset.assetType.replace(/_/g, " ")}
        </Badge>
        <Badge className={classificationColors[asset.dataClassification] || ""}>
          {asset.dataClassification.replace(/_/g, " ")}
        </Badge>
        <Badge className={riskColors[asset.riskLevel] || ""}>
          {asset.riskLevel}
        </Badge>
        {asset.personalData && <Badge variant="outline">Contains Personal Data</Badge>}
        {asset.specialCategoryData && <Badge variant="outline">Contains Special Category Data</Badge>}
      </div>

      {/* Asset Details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Details</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Asset Owner</p>
            <p className="text-sm text-gray-900 mt-1">{asset.assetOwner}</p>
          </div>
          {asset.location && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Location</p>
              <p className="text-sm text-gray-900 mt-1">{asset.location}</p>
            </div>
          )}
        </div>
        {asset.description && (
          <div className="mt-6">
            <p className="text-xs font-medium text-gray-500 uppercase">Description</p>
            <p className="text-sm text-gray-900 mt-1">{asset.description}</p>
          </div>
        )}
      </Card>

      {/* Data Classification */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Classification</h2>
        <div className="space-y-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Personal Data</p>
            <p className="text-sm text-gray-900 mt-1">{asset.personalData ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Special Category Data</p>
            <p className="text-sm text-gray-900 mt-1">{asset.specialCategoryData ? "Yes" : "No"}</p>
          </div>
        </div>
      </Card>

      {/* Security Controls */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Controls</h2>
        <div className="space-y-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Encryption at Rest</p>
            <p className="text-sm text-gray-900 mt-1">
              {asset.encryptionAtRest ? (
                <span className="text-green-600 font-semibold">✓ Yes</span>
              ) : (
                <span className="text-gray-500">No</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Encryption in Transit</p>
            <p className="text-sm text-gray-900 mt-1">
              {asset.encryptionInTransit ? (
                <span className="text-green-600 font-semibold">✓ Yes</span>
              ) : (
                <span className="text-gray-500">No</span>
              )}
            </p>
          </div>
          {asset.accessControls && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Access Controls</p>
              <p className="text-sm text-gray-900 mt-1">{asset.accessControls}</p>
            </div>
          )}
          {asset.backupFrequency && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Backup Frequency</p>
              <p className="text-sm text-gray-900 mt-1">{asset.backupFrequency}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Retention */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Retention & Disposal</h2>
        <div className="space-y-6">
          {asset.retentionPeriod && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Retention Period</p>
              <p className="text-sm text-gray-900 mt-1">{asset.retentionPeriod}</p>
            </div>
          )}
          {asset.disposalMethod && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Disposal Method</p>
              <p className="text-sm text-gray-900 mt-1">{asset.disposalMethod}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Review Schedule */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Schedule</h2>
        <form action={updateAsset} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Review Date
              </label>
              <input
                type="date"
                name="lastReviewDate"
                defaultValue={
                  asset.lastReviewDate ? asset.lastReviewDate.toISOString().split("T")[0] : ""
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
                  asset.nextReviewDate ? asset.nextReviewDate.toISOString().split("T")[0] : ""
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              defaultValue={asset.notes || ""}
              placeholder="Additional notes"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Button type="submit">Save Changes</Button>
        </form>
      </Card>
    </div>
  );
}
