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

export default async function NewDonationPage() {
  const [contacts, campaigns, ledgerCodes, events] = await Promise.all([
    prisma.contact.findMany({ orderBy: { lastName: "asc" } }),
    prisma.campaign.findMany({ orderBy: { name: "asc" } }),
    prisma.ledgerCode.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.event.findMany({
      where: { status: { not: "CANCELLED" } },
      orderBy: { startDate: "desc" },
      select: { id: true, name: true, startDate: true },
    }),
  ]);

  async function createDonation(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const amount = parseFloat(formData.get("amount") as string);
    const isGiftAidable = (formData.get("isGiftAidable") as string) === "on";

    const donation = await prisma.donation.create({
      data: {
        contactId: formData.get("contactId") as string,
        amount,
        currency: formData.get("currency") as string,
        type: formData.get("type") as string,
        method: (formData.get("method") as string) || null,
        reference: (formData.get("reference") as string) || null,
        date: new Date(formData.get("date") as string),
        ledgerCodeId: (formData.get("ledgerCodeId") as string) || null,
        campaignId: (formData.get("campaignId") as string) || null,
        eventId: (formData.get("eventId") as string) || null,
        isGiftAidable,
        notes: (formData.get("notes") as string) || null,
        createdById: session.id,
      },
    });

    await logAudit({ userId: session.id, action: "CREATE", entityType: "Donation", entityId: donation.id, details: { amount, type: formData.get("type") } });
    revalidatePath("/finance/donations");
    redirect(`/finance/donations/${donation.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/donations" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Record Donation</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createDonation} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
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
              <Input label="Date" name="date" type="date" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Amount" name="amount" type="number" step="0.01" required />
              <Select
                label="Currency"
                name="currency"
                options={[{ value: "GBP", label: "GBP (£)" }]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Type"
                name="type"
                required
                options={[
                  { value: "DONATION", label: "Donation" },
                  { value: "PAYMENT", label: "Payment" },
                  { value: "GIFT", label: "Gift" },
                  { value: "EVENT_FEE", label: "Event Fee" },
                  { value: "SPONSORSHIP", label: "Sponsorship" },
                  { value: "LEGACY", label: "Legacy" },
                  { value: "GRANT", label: "Grant" },
                  { value: "IN_KIND", label: "In Kind" },
                ]}
              />
              <Select
                label="Method"
                name="method"
                placeholder="Select method (optional)"
                options={[
                  { value: "CASH", label: "Cash" },
                  { value: "CHEQUE", label: "Cheque" },
                  { value: "CARD", label: "Card" },
                  { value: "DIRECT_DEBIT", label: "Direct Debit" },
                  { value: "STANDING_ORDER", label: "Standing Order" },
                  { value: "BANK_TRANSFER", label: "Bank Transfer" },
                  { value: "ONLINE", label: "Online" },
                  { value: "OTHER", label: "Other" },
                ]}
              />
            </div>

            <Input label="Reference" name="reference" placeholder="e.g. receipt number" />

            <Select
              label="Ledger Code"
              name="ledgerCodeId"
              placeholder="Select code (optional)"
              options={ledgerCodes.map((code) => ({
                value: code.id,
                label: `${code.code} - ${code.name}`,
              }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Campaign"
                name="campaignId"
                placeholder="Select campaign (optional)"
                options={campaigns.map((campaign) => ({
                  value: campaign.id,
                  label: campaign.name,
                }))}
              />
              <Select
                label="Event"
                name="eventId"
                placeholder="Select event (optional)"
                options={events.map((event) => ({
                  value: event.id,
                  label: event.name,
                }))}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isGiftAidable"
                name="isGiftAidable"
                className="rounded border-gray-300"
              />
              <label htmlFor="isGiftAidable" className="text-sm font-medium text-gray-700">
                Eligible for Gift Aid
              </label>
            </div>

            <Input label="Notes" name="notes" placeholder="Additional notes..." />

            <div className="flex justify-end gap-3">
              <Link href="/finance/donations">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">Record Donation</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
