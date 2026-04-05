import { formatDate, formatShortDate } from '@/lib/utils';
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Eye, Edit2, Trash2, Power, PowerOff } from "lucide-react";
import { revalidatePath } from "next/cache";

export const metadata = {
  title: "Automations",
};

export default async function AutomationsPage() {
  await requireRole(["ADMIN", "STAFF"]);

  const rules = await prisma.automationRule.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  async function toggleActive(ruleId: string, currentStatus: boolean) {
    "use server";
    await requireAuth();

    await prisma.automationRule.update({
      where: { id: ruleId },
      data: { isActive: !currentStatus },
    });

    revalidatePath("/settings/automations");
  }

  async function deleteRule(ruleId: string) {
    "use server";
    await requireAuth();

    await prisma.automationRule.delete({
      where: { id: ruleId },
    });

    revalidatePath("/settings/automations");
  }

  const triggerLabels: Record<string, string> = {
    DONATION_RECEIVED: "Donation Received",
    CONTACT_CREATED: "Contact Created",
    TAG_ADDED: "Tag Added",
    EVENT_REGISTERED: "Event Registered",
    MEMBERSHIP_RENEWED: "Membership Renewed",
    GIFT_AID_DECLARED: "Gift Aid Declared",
    CAMPAIGN_TARGET_MET: "Campaign Target Met",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automations</h1>
          <p className="text-gray-500 mt-1">Create and manage automation rules</p>
        </div>
        <Link href="/settings/automations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Rule
          </Button>
        </Link>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500 mb-4">No automation rules yet</p>
            <Link href="/settings/automations/new">
              <Button>Create Your First Rule</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Rule Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Trigger
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Runs
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Last Run
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{rule.name}</p>
                          <p className="text-sm text-gray-500">
                            by {rule.createdBy.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {triggerLabels[rule.trigger] || rule.trigger}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {rule.isActive ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {rule.runCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {rule.lastRunAt
                          ? formatDate(rule.lastRunAt)
                          : "Never"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <form action={toggleActive.bind(null, rule.id, rule.isActive)}>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="submit"
                              title={
                                rule.isActive ? "Disable rule" : "Enable rule"
                              }
                            >
                              {rule.isActive ? (
                                <Power className="h-4 w-4" />
                              ) : (
                                <PowerOff className="h-4 w-4" />
                              )}
                            </Button>
                          </form>
                          <Link
                            href={`/settings/automations/${rule.id}`}
                            title="View rule"
                          >
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link
                            href={`/settings/automations/${rule.id}/edit`}
                            title="Edit rule"
                          >
                            <Button variant="ghost" size="sm">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </Link>
                          <form action={deleteRule.bind(null, rule.id)}>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="submit"
                              title="Delete rule"
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>Triggers:</strong> Define when a rule should run (e.g., when
            a donation is received).
          </p>
          <p>
            <strong>Conditions:</strong> Add optional filters to narrow when
            rules apply (e.g., only donations over £100).
          </p>
          <p>
            <strong>Actions:</strong> Define what happens when a rule triggers
            (e.g., send a thank-you email).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
