import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { logAudit } from "@/lib/audit";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewPaymentPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { lastName: "asc" },
  });

  const providers = await prisma.paymentProvider.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  async function createPayment(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const amount = parseFloat(formData.get("amount") as string);

    const payment = await prisma.payment.create({
      data: {
        contactId: formData.get("contactId") as string,
        amount,
        currency: formData.get("currency") as string,
        type: formData.get("type") as string,
        method: (formData.get("method") as string) || null,
        status: "SUCCEEDED",
        description: (formData.get("description") as string) || null,
        providerId: (formData.get("providerId") as string) || null,
        paidAt: new Date(formData.get("paidAt") as string),
      },
    });

    await logAudit({
      userId: session.id,
      action: "CREATE",
      entityType: "Payment",
      entityId: payment.id,
      details: { amount, type: formData.get("type") },
    });

    revalidatePath("/finance/payments");
    redirect(`/finance/payments/${payment.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/payments" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createPayment} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact
                </label>
                <SearchableSelect
                  name="contactId"
                  required
                  placeholder="Search contacts..."
                  options={contacts.map((contact) => ({
                    value: contact.id,
                    label: `${contact.firstName} ${contact.lastName}`,
                  }))}
                />
              </div>
              <Input label="Date Paid" name="paidAt" type="date" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Amount" name="amount" type="number" step="0.01" required />
              <Select
                label="Currency"
                name="currency"
                defaultValue="GBP"
                options={[{ value: "GBP", label: "GBP (£)" }]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Type"
                name="type"
                required
                options={[
                  { value: "ONE_OFF", label: "One-off" },
                  { value: "SUBSCRIPTION", label: "Subscription" },
                  { value: "EVENT_FEE", label: "Event Fee" },
                  { value: "MEMBERSHIP_FEE", label: "Membership Fee" },
                ]}
              />
              <Select
                label="Method"
                name="method"
                placeholder="Select method (optional)"
                options={[
                  { value: "CARD", label: "Card" },
                  { value: "DIRECT_DEBIT", label: "Direct Debit" },
                  { value: "BANK_TRANSFER", label: "Bank Transfer" },
                  { value: "CASH", label: "Cash" },
                  { value: "CHEQUE", label: "Cheque" },
                  { value: "ONLINE", label: "Online" },
                  { value: "OTHER", label: "Other" },
                ]}
              />
            </div>

            <Select
              label="Payment Provider"
              name="providerId"
              placeholder="Select provider (optional)"
              options={providers.map((provider) => ({
                value: provider.id,
                label: provider.name,
              }))}
            />

            <Input
              label="Description"
              name="description"
              placeholder="e.g. Annual donation, Event sponsorship..."
            />

            <div className="flex justify-end gap-3">
              <Link href="/finance/payments">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">Record Payment</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
