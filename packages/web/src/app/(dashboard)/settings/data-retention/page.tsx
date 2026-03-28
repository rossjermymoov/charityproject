import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default async function DataRetentionPage() {
  await requireAuth();

  const policies = await prisma.dataRetentionPolicy.findMany({
    orderBy: { createdAt: "asc" },
  });

  async function createPolicy(formData: FormData) {
    "use server";
    await requireAuth();

    const entityType = formData.get("entityType") as string;
    const retentionDays = parseInt(formData.get("retentionDays") as string);
    const action = formData.get("action") as string;

    await prisma.dataRetentionPolicy.create({
      data: {
        entityType,
        retentionDays,
        action,
        isActive: true,
      },
    });

    redirect("/dashboard/settings/data-retention");
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

    redirect("/dashboard/settings/data-retention");
  }

  async function deletePolicy(formData: FormData) {
    "use server";
    await requireAuth();

    const id = formData.get("id") as string;
    await prisma.dataRetentionPolicy.delete({
      where: { id },
    });

    redirect("/dashboard/settings/data-retention");
  }

  const actionOptions = ["ARCHIVE", "ANONYMISE", "DELETE"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Retention Policies</h1>
        <p className="text-gray-500 mt-1">
          Configure how long different data types are retained before automatic action
        </p>
      </div>

      {/* Create form */}
      <Card className="p-4">
        <form action={createPolicy} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity Type
              </label>
              <input
                name="entityType"
                required
                placeholder="e.g. Contact, Donation"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retention Days
              </label>
              <input
                name="retentionDays"
                type="number"
                required
                placeholder="e.g. 365"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
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
                <option value="">Select action</option>
                {actionOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked
                  disabled
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active
                </span>
              </label>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Add Policy
              </Button>
            </div>
          </div>
        </form>
      </Card>

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
                    Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {policies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {policy.entityType}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {policy.retentionDays} days (~{Math.floor(policy.retentionDays / 365)} years)
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
            <strong>ARCHIVE:</strong> Moves old records to cold storage, keeping them accessible for compliance
          </li>
          <li>
            <strong>ANONYMISE:</strong> Replaces personally identifiable information while keeping aggregate data
          </li>
          <li>
            <strong>DELETE:</strong> Permanently removes records from all systems
          </li>
        </ul>
      </Card>
    </div>
  );
}
