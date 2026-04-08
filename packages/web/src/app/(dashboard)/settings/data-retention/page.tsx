import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const ENTITY_TYPES = [
  { value: "Contact", label: "Contacts" },
  { value: "Donation", label: "Donations" },
  { value: "GiftAid", label: "Gift Aid Declarations" },
  { value: "Interaction", label: "Interactions" },
  { value: "Note", label: "Notes" },
  { value: "AuditLog", label: "Audit Logs" },
  { value: "Payment", label: "Payments" },
  { value: "Subscription", label: "Subscriptions" },
  { value: "Membership", label: "Memberships" },
  { value: "Event", label: "Events" },
  { value: "EventAttendee", label: "Event Attendees" },
  { value: "Campaign", label: "Campaigns" },
  { value: "BankDocument", label: "Bank Documents" },
  { value: "EmailMarketingSync", label: "Email Marketing Syncs" },
  { value: "SubjectAccessRequest", label: "Subject Access Requests" },
  { value: "DataBreach", label: "Data Breaches" },
  { value: "ConsentRecord", label: "Consent Records" },
  { value: "Legacy", label: "Legacies" },
  { value: "Grant", label: "Grants" },
  { value: "CaseRecord", label: "Cases" },
  { value: "VolunteerProfile", label: "Volunteer Profiles" },
  { value: "SmsMessage", label: "SMS Messages" },
  { value: "Broadcast", label: "Broadcasts" },
  { value: "Form", label: "Forms" },
  { value: "FormSubmission", label: "Form Submissions" },
];

const ACTION_OPTIONS = [
  { value: "ARCHIVE", label: "Archive", description: "Move to cold storage" },
  { value: "ANONYMISE", label: "Anonymise", description: "Remove PII, keep aggregate data" },
  { value: "DELETE", label: "Delete", description: "Permanently remove" },
];

const RETENTION_PERIODS = [
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "1 year" },
  { value: 24, label: "2 years" },
  { value: 36, label: "3 years" },
  { value: 60, label: "5 years" },
  { value: 72, label: "6 years" },
  { value: 84, label: "7 years" },
  { value: 120, label: "10 years" },
];

export default async function DataRetentionPage() {
  await requireAuth();

  const policies = await prisma.dataRetentionPolicy.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Determine which entity types are already used
  const usedTypes = new Set(policies.map((p) => p.entityType));
  const availableTypes = ENTITY_TYPES.filter((et) => !usedTypes.has(et.value));

  async function createPolicy(formData: FormData) {
    "use server";
    await requireAuth();

    const entityType = formData.get("entityType") as string;
    const retentionMonths = parseInt(formData.get("retentionMonths") as string);
    const action = formData.get("action") as string;

    if (!entityType || !retentionMonths || !action) return;

    await prisma.dataRetentionPolicy.create({
      data: {
        entityType,
        retentionMonths,
        action,
        isActive: true,
      },
    });

    redirect("/settings/data-retention");
  }

  async function toggleActive(formData: FormData) {
    "use server";
    await requireAuth();

    const id = formData.get("id") as string;
    const currentValue = formData.get("currentValue") === "true";

    await prisma.dataRetentionPolicy.update({
      where: { id },
      data: { isActive: !currentValue },
    });

    redirect("/settings/data-retention");
  }

  async function deletePolicy(formData: FormData) {
    "use server";
    await requireAuth();

    const id = formData.get("id") as string;
    await prisma.dataRetentionPolicy.delete({
      where: { id },
    });

    redirect("/settings/data-retention");
  }

  function formatRetention(months: number): string {
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
    const years = Math.floor(months / 12);
    const remaining = months % 12;
    if (remaining === 0) return `${years} year${years !== 1 ? "s" : ""}`;
    return `${years}y ${remaining}m`;
  }

  function getEntityLabel(value: string): string {
    return ENTITY_TYPES.find((et) => et.value === value)?.label || value;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Retention Policies</h1>
        <p className="text-gray-500 mt-1">
          Configure how long different data types are retained before automatic action
        </p>
      </div>

      {/* Create form */}
      {availableTypes.length > 0 && (
        <Card className="p-4">
          <form action={createPolicy} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entity Type
                </label>
                <select
                  name="entityType"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select entity type...</option>
                  {availableTypes.map((et) => (
                    <option key={et.value} value={et.value}>
                      {et.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retention Period
                </label>
                <select
                  name="retentionMonths"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select period...</option>
                  {RETENTION_PERIODS.map((rp) => (
                    <option key={rp.value} value={rp.value}>
                      {rp.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action
                </label>
                <select
                  name="action"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select action...</option>
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Add Policy
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Policies table */}
      {policies.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No data retention policies"
          description="Create your first policy to automate data lifecycle management."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retention Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {policies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {getEntityLabel(policy.entityType)}
                      </p>
                      <p className="text-xs text-gray-400">{policy.entityType}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatRetention(policy.retentionMonths)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{policy.action}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <form action={toggleActive} className="inline">
                        <input type="hidden" name="id" value={policy.id} />
                        <input
                          type="hidden"
                          name="currentValue"
                          value={String(policy.isActive)}
                        />
                        <button type="submit" className="hover:underline">
                          <Badge
                            variant={policy.isActive ? "default" : "outline"}
                          >
                            {policy.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </button>
                      </form>
                    </td>
                    <td className="px-6 py-4">
                      <form action={deletePolicy} className="inline">
                        <input type="hidden" name="id" value={policy.id} />
                        <button
                          type="submit"
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Info section */}
      <Card className="p-4 bg-amber-50 border border-amber-100">
        <h3 className="text-sm font-semibold text-amber-900 mb-2">
          How it works
        </h3>
        <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
          <li>
            <strong>Archive:</strong> Moves old records to cold storage, keeping them accessible for compliance
          </li>
          <li>
            <strong>Anonymise:</strong> Replaces personally identifiable information while keeping aggregate data
          </li>
          <li>
            <strong>Delete:</strong> Permanently removes records from all systems
          </li>
        </ul>
      </Card>
    </div>
  );
}
