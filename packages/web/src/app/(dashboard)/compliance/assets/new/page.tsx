import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewAssetPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  async function createAsset(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.informationAsset.create({
      data: {
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || null,
        assetOwner: formData.get("assetOwner") as string,
        assetType: formData.get("assetType") as string,
        location: (formData.get("location") as string) || null,
        dataClassification: formData.get("dataClassification") as string,
        personalData: formData.get("personalData") === "on",
        specialCategoryData: formData.get("specialCategoryData") === "on",
        riskLevel: formData.get("riskLevel") as string,
        encryptionAtRest: formData.get("encryptionAtRest") === "on",
        encryptionInTransit: formData.get("encryptionInTransit") === "on",
        accessControls: (formData.get("accessControls") as string) || null,
        backupFrequency: (formData.get("backupFrequency") as string) || null,
        retentionPeriod: (formData.get("retentionPeriod") as string) || null,
        disposalMethod: (formData.get("disposalMethod") as string) || null,
        lastReviewDate: formData.get("lastReviewDate")
          ? new Date(formData.get("lastReviewDate") as string)
          : null,
        nextReviewDate: formData.get("nextReviewDate")
          ? new Date(formData.get("nextReviewDate") as string)
          : null,
        notes: (formData.get("notes") as string) || null,
      },
    });

    redirect("/dashboard/compliance/assets");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/compliance/assets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Information Asset</h1>
          <p className="text-gray-500 mt-1">Add asset to the Information Asset Register</p>
        </div>
      </div>

      <form action={createAsset} className="space-y-6">
        {/* Asset Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Name *
              </label>
              <input
                name="name"
                required
                placeholder="e.g. CRM Database, Volunteer Records"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                placeholder="What does this asset contain and what is it used for?"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Owner *
                </label>
                <input
                  name="assetOwner"
                  required
                  placeholder="Person responsible"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Type *
                </label>
                <select
                  name="assetType"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select...</option>
                  <option value="DATABASE">Database</option>
                  <option value="FILE_SYSTEM">File System</option>
                  <option value="CLOUD_SERVICE">Cloud Service</option>
                  <option value="PAPER">Paper</option>
                  <option value="APPLICATION">Application</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                name="location"
                placeholder="e.g. On-premises server, AWS S3, Paper filing cabinet"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* Data Classification */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Classification</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Classification Level *
              </label>
              <select
                name="dataClassification"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="OFFICIAL">Official</option>
                <option value="OFFICIAL_SENSITIVE">Official Sensitive</option>
                <option value="SECRET">Secret</option>
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="personalData"
                  id="personalData"
                  className="rounded border-gray-300"
                />
                <label htmlFor="personalData" className="ml-2 text-sm text-gray-700">
                  Contains personal data
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="specialCategoryData"
                  id="specialCategoryData"
                  className="rounded border-gray-300"
                />
                <label htmlFor="specialCategoryData" className="ml-2 text-sm text-gray-700">
                  Contains special category data
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Risk Level *
              </label>
              <select
                name="riskLevel"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Security Controls */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Controls</h2>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="encryptionAtRest"
                  id="encryptionAtRest"
                  className="rounded border-gray-300"
                />
                <label htmlFor="encryptionAtRest" className="ml-2 text-sm text-gray-700">
                  Encrypted at rest
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="encryptionInTransit"
                  id="encryptionInTransit"
                  className="rounded border-gray-300"
                />
                <label htmlFor="encryptionInTransit" className="ml-2 text-sm text-gray-700">
                  Encrypted in transit (TLS/HTTPS)
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Controls
              </label>
              <textarea
                name="accessControls"
                placeholder="e.g. Role-based access control, multi-factor authentication"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Backup Frequency
              </label>
              <input
                name="backupFrequency"
                placeholder="e.g. Daily, Weekly, Monthly"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* Retention & Review */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Retention & Review</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retention Period
              </label>
              <input
                name="retentionPeriod"
                placeholder="e.g. 7 years, Ongoing, Until project completion"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Disposal Method
              </label>
              <textarea
                name="disposalMethod"
                placeholder="e.g. Secure deletion, Incineration, Shredding"
                rows={2}
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                placeholder="Additional notes"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit">Create Asset</Button>
          <Link href="/dashboard/compliance/assets">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
