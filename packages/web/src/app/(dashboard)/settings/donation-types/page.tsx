import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag, Plus, Trash2, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function DonationTypesSettingsPage() {
  await requireRole(["ADMIN"]);

  const [types, ledgerCodes] = await Promise.all([
    prisma.donationType.findMany({
      orderBy: { sortOrder: "asc" },
      include: { defaultLedgerCode: { select: { id: true, code: true, name: true } } },
    }),
    prisma.ledgerCode.findMany({ where: { isActive: true }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
  ]);

  async function addType(formData: FormData) {
    "use server";
    await requireRole(["ADMIN"]);
    const name = (formData.get("name") as string).trim().toUpperCase().replace(/\s+/g, "_");
    const label = (formData.get("label") as string).trim();
    const isGiftAidEligible = (formData.get("isGiftAidEligible") as string) === "on";
    const ledgerCodeId = (formData.get("defaultLedgerCodeId") as string) || null;
    if (!name || !label) return;
    const maxSort = await prisma.donationType.aggregate({ _max: { sortOrder: true } });
    await prisma.donationType.create({
      data: { name, label, isGiftAidEligible, isSystem: false, sortOrder: (maxSort._max.sortOrder || 0) + 1, defaultLedgerCodeId: ledgerCodeId },
    });
    revalidatePath("/settings/donation-types");
    redirect("/settings/donation-types");
  }

  async function toggleType(formData: FormData) {
    "use server";
    await requireRole(["ADMIN"]);
    const id = formData.get("id") as string;
    const current = await prisma.donationType.findUnique({ where: { id } });
    if (!current) return;
    await prisma.donationType.update({ where: { id }, data: { isActive: !current.isActive } });
    revalidatePath("/settings/donation-types");
    redirect("/settings/donation-types");
  }

  async function toggleGiftAid(formData: FormData) {
    "use server";
    await requireRole(["ADMIN"]);
    const id = formData.get("id") as string;
    const current = await prisma.donationType.findUnique({ where: { id } });
    if (!current) return;
    await prisma.donationType.update({ where: { id }, data: { isGiftAidEligible: !current.isGiftAidEligible } });
    revalidatePath("/settings/donation-types");
    redirect("/settings/donation-types");
  }

  async function updateLedgerCode(formData: FormData) {
    "use server";
    await requireRole(["ADMIN"]);
    const id = formData.get("id") as string;
    const ledgerCodeId = (formData.get("ledgerCodeId") as string) || null;
    await prisma.donationType.update({ where: { id }, data: { defaultLedgerCodeId: ledgerCodeId } });
    revalidatePath("/settings/donation-types");
    redirect("/settings/donation-types");
  }

  async function deleteType(formData: FormData) {
    "use server";
    await requireRole(["ADMIN"]);
    const id = formData.get("id") as string;
    const dt = await prisma.donationType.findUnique({ where: { id } });
    if (!dt || dt.isSystem) return;
    const inUse = await prisma.donation.count({ where: { type: dt.name } });
    if (inUse > 0) {
      await prisma.donationType.update({ where: { id }, data: { isActive: false } });
    } else {
      await prisma.donationType.delete({ where: { id } });
    }
    revalidatePath("/settings/donation-types");
    redirect("/settings/donation-types");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donation Types</h1>
          <p className="text-gray-500 mt-1">Configure donation types and their Gift Aid eligibility</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Tag className="h-5 w-5" /> Donation Types
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Types marked with the Gift Aid badge will automatically flag donations as Gift Aid eligible when the donor has an active declaration. Toggle Gift Aid eligibility by clicking the GA button.
          </p>

          <div className="space-y-2 mb-6">
            {types.map((dt) => (
              <div key={dt.id} className="flex items-center gap-3 py-2 px-3 rounded-lg border bg-white">
                <span className={`text-sm font-medium min-w-[120px] ${!dt.isActive ? "text-gray-400 line-through" : "text-gray-900"}`}>
                  {dt.label}
                </span>
                <span className="text-[10px] font-mono text-gray-400 w-24 shrink-0">{dt.name}</span>

                {/* Ledger code assignment */}
                <form action={updateLedgerCode} className="inline shrink-0">
                  <input type="hidden" name="id" value={dt.id} />
                  <select
                    name="ledgerCodeId"
                    defaultValue={dt.defaultLedgerCodeId || ""}
                    onChange={(e) => (e.target as HTMLSelectElement).form?.requestSubmit()}
                    className="text-xs h-7 px-1.5 rounded border border-gray-200 bg-gray-50 text-gray-700 w-36"
                  >
                    <option value="">No ledger code</option>
                    {ledgerCodes.map((lc) => (
                      <option key={lc.id} value={lc.id}>{lc.code} - {lc.name}</option>
                    ))}
                  </select>
                </form>

                {/* Gift Aid toggle */}
                <form action={toggleGiftAid} className="inline">
                  <input type="hidden" name="id" value={dt.id} />
                  <Button
                    variant="ghost"
                    size="sm"
                    type="submit"
                    className={`text-xs h-7 px-2 gap-1 ${dt.isGiftAidEligible ? "text-green-700 bg-green-50 hover:bg-green-100" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <Heart className="h-3 w-3" />
                    {dt.isGiftAidEligible ? "GA Eligible" : "No GA"}
                  </Button>
                </form>

                {dt.isSystem && (
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">System</span>
                )}
                <form action={toggleType} className="inline">
                  <input type="hidden" name="id" value={dt.id} />
                  <Button variant="ghost" size="sm" type="submit" className="text-xs h-7 px-2">
                    {dt.isActive ? "Disable" : "Enable"}
                  </Button>
                </form>
                {!dt.isSystem && (
                  <form action={deleteType} className="inline">
                    <input type="hidden" name="id" value={dt.id} />
                    <Button variant="ghost" size="sm" type="submit" className="text-xs h-7 px-2 text-red-500 hover:text-red-700">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                )}
              </div>
            ))}
          </div>

          <form action={addType} className="space-y-3">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input label="Display Label" name="label" placeholder="e.g. Standing Order" required />
              </div>
              <div className="w-40">
                <Input label="System Name" name="name" placeholder="e.g. STANDING_ORDER" required />
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ledger Code</label>
                <select name="defaultLedgerCodeId" className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm">
                  <option value="">None</option>
                  {ledgerCodes.map((lc) => (
                    <option key={lc.id} value={lc.id}>{lc.code} - {lc.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pb-2">
                <input type="checkbox" id="newGiftAid" name="isGiftAidEligible" className="rounded border-gray-300" />
                <label htmlFor="newGiftAid" className="text-xs font-medium text-gray-700 whitespace-nowrap">Gift Aid</label>
              </div>
              <Button type="submit" className="flex items-center gap-1">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
