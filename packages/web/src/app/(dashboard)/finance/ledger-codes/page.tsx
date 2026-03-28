import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus } from "lucide-react";

export default async function LedgerCodesPage() {
  const ledgerCodes = await prisma.ledgerCode.findMany({
    orderBy: { code: "asc" },
  });

  async function createLedgerCode(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const code = (formData.get("code") as string).trim();
    const name = (formData.get("name") as string).trim();
    const description = (formData.get("description") as string) || null;

    if (!code || !name) return;

    await prisma.ledgerCode.create({
      data: {
        code,
        name,
        description,
      },
    });

    revalidatePath("/dashboard/finance/ledger-codes");
  }

  async function toggleLedgerCode(id: string, isActive: boolean) {
    "use server";
    const session = await requireAuth();

    await prisma.ledgerCode.update({
      where: { id },
      data: { isActive: !isActive },
    });

    revalidatePath("/dashboard/finance/ledger-codes");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ledger Codes</h1>
        <p className="text-gray-500 mt-1">Manage finance ledger codes for categorizing transactions</p>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Add New Ledger Code</h2>
        </CardHeader>
        <CardContent>
          <form action={createLedgerCode} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Input label="Code" name="code" placeholder="e.g., GEN-001" required />
              <div className="col-span-2">
                <Input label="Name" name="name" placeholder="e.g., General Donations" required />
              </div>
            </div>
            <Input label="Description" name="description" placeholder="Optional description..." />
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Code
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Ledger codes list */}
      <Card>
        <CardContent className="pt-6">
          {ledgerCodes.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No ledger codes yet. Create one above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ledgerCodes.map((code) => (
                    <tr key={code.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{code.code}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{code.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500">{code.description || "—"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            code.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {code.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <form
                          action={async () => {
                            await toggleLedgerCode(code.id, code.isActive);
                          }}
                          className="inline"
                        >
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            {code.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
