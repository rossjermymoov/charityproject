import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Edit2, Trash2 } from "lucide-react";
import { LedgerCodeActionButton } from "./ledger-code-actions";

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

    revalidatePath("/finance/ledger-codes");
  }

  async function toggleLedgerCode(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";

    await prisma.ledgerCode.update({
      where: { id },
      data: { isActive: !isActive },
    });

    revalidatePath("/finance/ledger-codes");
  }

  async function updateLedgerCode(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const id = formData.get("id") as string;
    const code = (formData.get("code") as string).trim();
    const name = (formData.get("name") as string).trim();
    const description = (formData.get("description") as string) || null;

    if (!code || !name) return;

    await prisma.ledgerCode.update({
      where: { id },
      data: {
        code,
        name,
        description,
      },
    });

    revalidatePath("/finance/ledger-codes");
  }

  async function deleteLedgerCode(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const id = formData.get("id") as string;

    await prisma.ledgerCode.delete({
      where: { id },
    });

    revalidatePath("/finance/ledger-codes");
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
            <div className="space-y-4">
              {ledgerCodes.map((code) => (
                <div key={code.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-4 gap-4 items-start">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Code</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{code.code}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Name</p>
                      <p className="text-sm text-gray-900 mt-1">{code.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                      <Badge
                        className={`mt-1 ${
                          code.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {code.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-end gap-2">
                      <LedgerCodeActionButton
                        code={code}
                        updateLedgerCode={updateLedgerCode}
                        toggleLedgerCode={toggleLedgerCode}
                        deleteLedgerCode={deleteLedgerCode}
                      />
                    </div>
                  </div>
                  {code.description && (
                    <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">{code.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
