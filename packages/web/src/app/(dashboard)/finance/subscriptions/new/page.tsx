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

export default async function NewSubscriptionPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { lastName: "asc" },
  });

  const providers = await prisma.paymentProvider.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  async function createSubscription(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const amount = parseFloat(formData.get("amount") as string);
    const startDate = new Date(formData.get("startDate") as string);

    // Calculate next payment date based on frequency
    const frequency = formData.get("frequency") as string;
    const nextPaymentDate = new Date(startDate);

    switch (frequency) {
      case "WEEKLY":
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
        break;
      case "MONTHLY":
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        break;
      case "QUARTERLY":
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
        break;
      case "ANNUALLY":
        nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
        break;
    }

    const subscription = await prisma.subscription.create({
      data: {
        contactId: formData.get("contactId") as string,
        amount,
        currency: formData.get("currency") as string,
        frequency,
        status: "ACTIVE",
        startDate,
        nextPaymentDate,
        providerId: (formData.get("providerId") as string) || null,
      },
    });

    await logAudit({
      userId: session.id,
      action: "CREATE",
      entityType: "Subscription",
      entityId: subscription.id,
      details: { amount, frequency },
    });

    revalidatePath("/finance/subscriptions");
    redirect(`/finance/subscriptions/${subscription.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/subscriptions" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Subscription</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createSubscription} className="space-y-6">
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
              <Input label="Start Date" name="startDate" type="date" required />
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

            <Select
              label="Frequency"
              name="frequency"
              required
              options={[
                { value: "WEEKLY", label: "Weekly" },
                { value: "MONTHLY", label: "Monthly" },
                { value: "QUARTERLY", label: "Quarterly" },
                { value: "ANNUALLY", label: "Annually" },
              ]}
            />

            <Select
              label="Payment Provider"
              name="providerId"
              placeholder="Select provider (optional)"
              options={providers.map((provider) => ({
                value: provider.id,
                label: provider.name,
              }))}
            />

            <div className="flex justify-end gap-3">
              <Link href="/finance/subscriptions">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">Create Subscription</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
