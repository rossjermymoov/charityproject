import { requireRole } from "@/lib/session";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { addAccountMapping, removeAccountMapping } from "../actions";

const DONATION_TYPES = [
  { value: "DONATION", label: "General Donation" },
  { value: "EVENT_FEE", label: "Event Fee" },
  { value: "SPONSORSHIP", label: "Sponsorship" },
  { value: "LEGACY", label: "Legacy Gift" },
  { value: "GRANT", label: "Grant" },
  { value: "MEMBERSHIP", label: "Membership" },
  { value: "PAYMENT", label: "Payment" },
  { value: "OTHER", label: "Other" },
];

const DIRECTIONS = [
  { value: "DEBIT", label: "Debit" },
  { value: "CREDIT", label: "Credit" },
];

// ── Page ──────────────────────────────────────────────────────────

export default async function AccountMappingsPage() {
  const user = await requireRole(["ADMIN"]);

  const mappings = await prisma.sageAccountMapping.findMany({
    include: {
      ledgerCode: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const ledgerCodes = await prisma.ledgerCode.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings" className="hover:text-gray-700">
            Settings
          </Link>
          <span>/</span>
          <Link href="/settings/integrations" className="hover:text-gray-700">
            Integrations
          </Link>
          <span>/</span>
          <Link
            href="/settings/integrations/sage-intacct"
            className="hover:text-gray-700"
          >
            Sage Intacct
          </Link>
          <span>/</span>
          <span>Account Mappings</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/settings/integrations/sage-intacct"
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Account Mappings
              </h1>
              <p className="text-gray-500 mt-1">
                Map donation types to Sage GL accounts and dimensions
              </p>
            </div>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Mapping
          </Button>
        </div>
      </div>

      {/* Explanation */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h3 className="font-semibold text-gray-900">How Mappings Work</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="text-indigo-600 font-semibold flex-shrink-0">
                1
              </span>
              <span>
                Select a donation type (e.g. "General Donation", "Event Fee",
                "Sponsorship")
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-indigo-600 font-semibold flex-shrink-0">
                2
              </span>
              <span>
                Link to an internal ledger code to organize your income by type
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-indigo-600 font-semibold flex-shrink-0">
                3
              </span>
              <span>
                Configure which Sage GL account should receive this income
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-indigo-600 font-semibold flex-shrink-0">
                4
              </span>
              <span>
                (Optional) Add Sage dimensions: department, location, project to
                tag entries
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Existing Mappings Table */}
      {mappings.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Donation Type
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Ledger Code
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Sage GL Account
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Department
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Direction
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((mapping) => (
                    <tr
                      key={mapping.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        {DONATION_TYPES.find(
                          (dt) => dt.value === mapping.donationType
                        )?.label || mapping.donationType || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {mapping.ledgerCode ? (
                          <div>
                            <p className="font-medium text-gray-900">
                              {mapping.ledgerCode.code}
                            </p>
                            <p className="text-xs text-gray-500">
                              {mapping.ledgerCode.name}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-mono text-sm font-medium">
                            {mapping.sageAccountNo}
                          </p>
                          <p className="text-xs text-gray-500">
                            {mapping.sageAccountName}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {mapping.sageDepartment ? (
                          <Badge variant="secondary">{mapping.sageDepartment}</Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            mapping.direction === "DEBIT"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {mapping.direction}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            mapping.isActive ? "default" : "secondary"
                          }
                          className={
                            mapping.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {mapping.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <form action={removeAccountMapping} method="POST">
                          <input
                            type="hidden"
                            name="mappingId"
                            value={mapping.id}
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-gray-500">No mappings configured yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Add your first mapping to start syncing donations to Sage
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Mapping Form */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Add New Mapping</h2>

          <form action={addAccountMapping} className="space-y-6">
            {/* Top row: Donation type and ledger code */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Donation Type"
                name="donationType"
                options={DONATION_TYPES}
                placeholder="Select a donation type..."
              />
              <Select
                label="Ledger Code (Optional)"
                name="ledgerCodeId"
                options={ledgerCodes.map((lc) => ({
                  value: lc.id,
                  label: `${lc.code} - ${lc.name}`,
                }))}
                placeholder="Select a ledger code..."
              />
            </div>

            {/* Sage Account Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">
                Sage GL Account
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="GL Account Number"
                  name="sageAccountNo"
                  placeholder="e.g. 4010"
                  required
                />
                <Input
                  label="Account Name (Optional)"
                  name="sageAccountName"
                  placeholder="e.g. Donation Income"
                />
              </div>
            </div>

            {/* Sage Dimensions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">
                Sage Dimensions (Optional)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Department"
                  name="sageDepartment"
                  placeholder="e.g. Operations"
                />
                <Input
                  label="Location"
                  name="sageLocation"
                  placeholder="e.g. Headquarters"
                />
                <Input
                  label="Project/Campaign"
                  name="sageProject"
                  placeholder="e.g. Annual Appeal"
                />
              </div>
            </div>

            {/* Direction */}
            <Select
              label="Debit/Credit Direction"
              name="direction"
              options={DIRECTIONS}
              defaultValue="DEBIT"
            />

            {/* Save Button */}
            <div className="flex justify-end">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Add Mapping
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
