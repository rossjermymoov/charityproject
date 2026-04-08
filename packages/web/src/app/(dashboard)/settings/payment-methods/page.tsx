import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function PaymentMethodsSettingsPage() {
  await requireRole(["ADMIN"]);

  const methods = await prisma.paymentMethod.findMany({
    orderBy: { sortOrder: "asc" },
  });

  async function addMethod(formData: FormData) {
    "use server";
    await requireRole(["ADMIN"]);
    const name = (formData.get("name") as string).trim();
    if (!name) return;
    const maxSort = await prisma.paymentMethod.aggregate({ _max: { sortOrder: true } });
    await prisma.paymentMethod.create({
      data: { name, isSystem: false, sortOrder: (maxSort._max.sortOrder || 0) + 1 },
    });
    revalidatePath("/settings/payment-methods");
    redirect("/settings/payment-methods");
  }

  async function toggleMethod(formData: FormData) {
    "use server";
    await requireRole(["ADMIN"]);
    const id = formData.get("id") as string;
    const current = await prisma.paymentMethod.findUnique({ where: { id } });
    if (!current) return;
    await prisma.paymentMethod.update({ where: { id }, data: { isActive: !current.isActive } });
    revalidatePath("/settings/payment-methods");
    redirect("/settings/payment-methods");
  }

  async function deleteMethod(formData: FormData) {
    "use server";
    await requireRole(["ADMIN"]);
    const id = formData.get("id") as string;
    const pm = await prisma.paymentMethod.findUnique({ where: { id } });
    if (!pm || pm.isSystem) return;
    // Check if method name is used in any donation
    const inUse = await prisma.donation.count({ where: { method: pm.name } });
    if (inUse > 0) {
      await prisma.paymentMethod.update({ where: { id }, data: { isActive: false } });
    } else {
      await prisma.paymentMethod.delete({ where: { id } });
    }
    revalidatePath("/settings/payment-methods");
    redirect("/settings/payment-methods");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-500 mt-1">Configure how donations and payments are received</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Payment Methods
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Manage the payment methods available when recording donations. System methods can be disabled but not deleted. Custom methods in use will be disabled instead of deleted.
          </p>

          <div className="space-y-2 mb-6">
            {methods.map((pm) => (
              <div key={pm.id} className="flex items-center gap-3 py-2 px-3 rounded-lg border bg-white">
                <CreditCard className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className={`flex-1 text-sm font-medium ${!pm.isActive ? "text-gray-400 line-through" : "text-gray-900"}`}>
                  {pm.name}
                </span>
                {pm.isSystem && (
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">System</span>
                )}
                <form action={toggleMethod} className="inline">
                  <input type="hidden" name="id" value={pm.id} />
                  <Button variant="ghost" size="sm" type="submit" className="text-xs h-7 px-2">
                    {pm.isActive ? "Disable" : "Enable"}
                  </Button>
                </form>
                {!pm.isSystem && (
                  <form action={deleteMethod} className="inline">
                    <input type="hidden" name="id" value={pm.id} />
                    <Button variant="ghost" size="sm" type="submit" className="text-xs h-7 px-2 text-red-500 hover:text-red-700">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                )}
              </div>
            ))}
          </div>

          <form action={addMethod} className="flex items-end gap-3">
            <div className="flex-1">
              <Input label="New Payment Method" name="name" placeholder="e.g. JustGiving" required />
            </div>
            <Button type="submit" className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
