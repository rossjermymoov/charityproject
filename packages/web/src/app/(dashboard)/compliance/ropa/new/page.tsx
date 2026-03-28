import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewRopaPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  async function createActivity(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const internationalTransfers = formData.get("internationalTransfers") === "on";

    await prisma.processingActivity.create({
      data: {
        name: formData.get("name") as string,
        purpose: formData.get("purpose") as string,
        legalBasis: formData.get("legalBasis") as string,
        dataController: formData.get("dataController") as string,
        dataProcessor: (formData.get("dataProcessor") as string) || null,
        dataSubjectCategories: formData.get("dataSubjectCategories") as string,
        dataCategories: formData.get("dataCategories") as string,
        specialCategories: (formData.get("specialCategories") as string) || null,
        recipientCategories: (formData.get("recipientCategories") as string) || null,
        internationalTransfers,
        transferSafeguards: internationalTransfers
          ? (formData.get("transferSafeguards") as string)
          : null,
        retentionPeriod: formData.get("retentionPeriod") as string,
        securityMeasures: (formData.get("securityMeasures") as string) || null,
        dpaInPlace: formData.get("dpaInPlace") === "on",
        dpaReference: (formData.get("dpaReference") as string) || null,
        lastReviewDate: formData.get("lastReviewDate")
          ? new Date(formData.get("lastReviewDate") as string)
          : null,
        nextReviewDate: formData.get("nextReviewDate")
          ? new Date(formData.get("nextReviewDate") as string)
          : null,
      },
    });

    redirect("/dashboard/compliance/ropa");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/compliance/ropa">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Processing Activity</h1>
          <p className="text-gray-500 mt-1">Document a data processing activity (GDPR Article 30)</p>
        </div>
      </div>

      <form action={createActivity} className="space-y-6">
        {/* Processing Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Name *
              </label>
              <input
                name="name"
                required
                placeholder="e.g. Donor Contact Management"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
              <textarea
                name="purpose"
                required
                placeholder="Why is this data processed?"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal Basis *
                </label>
                <select
                  name="legalBasis"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select...</option>
                  <option value="CONSENT">Consent</option>
                  <option value="PUBLIC_TASK">Public Task</option>
                  <option value="LEGITIMATE_INTEREST">Legitimate Interest</option>
                  <option value="LEGAL_OBLIGATION">Legal Obligation</option>
                  <option value="VITAL_INTEREST">Vital Interest</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Controller *
                </label>
                <input
                  name="dataController"
                  required
                  placeholder="Organisation name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Processor (Optional)
              </label>
              <input
                name="dataProcessor"
                placeholder="e.g. Mailchimp, Google Workspace"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* Data Categories */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Categories</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Subject Categories *
              </label>
              <textarea
                name="dataSubjectCategories"
                required
                placeholder="e.g. Donors, Volunteers, Beneficiaries"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Categories *
              </label>
              <textarea
                name="dataCategories"
                required
                placeholder="e.g. Name, Email, Phone, Address, Donation History"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Categories Data (Optional)
              </label>
              <textarea
                name="specialCategories"
                placeholder="e.g. Health data, Disability information, Criminal records"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* Data Sharing */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Sharing</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Categories (Optional)
              </label>
              <textarea
                name="recipientCategories"
                placeholder="e.g. Partner organisations, Regulatory bodies"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="internationalTransfers"
                id="internationalTransfers"
                className="rounded border-gray-300"
              />
              <label htmlFor="internationalTransfers" className="ml-2 text-sm text-gray-700">
                Transfers to countries outside UK/EEA
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transfer Safeguards
              </label>
              <textarea
                name="transferSafeguards"
                placeholder="e.g. Standard contractual clauses, adequacy decision"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* Security & Retention */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Security & Retention</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retention Period *
              </label>
              <input
                name="retentionPeriod"
                required
                placeholder="e.g. 7 years after last interaction"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Security Measures
              </label>
              <textarea
                name="securityMeasures"
                placeholder="e.g. Encrypted at rest, role-based access control, TLS in transit"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="dpaInPlace"
                id="dpaInPlace"
                className="rounded border-gray-300"
              />
              <label htmlFor="dpaInPlace" className="ml-2 text-sm text-gray-700">
                Data Processing Agreement in place
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DPA Reference
              </label>
              <input
                name="dpaReference"
                placeholder="e.g. DPA-2024-001"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* Review */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Schedule</h2>
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
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit">Create Activity</Button>
          <Link href="/dashboard/compliance/ropa">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
