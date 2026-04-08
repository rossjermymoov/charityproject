import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, FileText, Plus, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { logAudit } from "@/lib/audit";
import { formatDate } from "@/lib/utils";
import { ConfirmButton } from "@/components/ui/confirm-button";

export default async function BankDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();

  const bankDoc = await prisma.bankDocument.findUnique({
    where: { id },
    include: {
      createdBy: true,
      donations: {
        include: {
          contact: true,
          ledgerCode: true,
          campaign: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!bankDoc) notFound();

  const isOpen = bankDoc.status === "OPEN";

  const [contacts, campaigns, ledgerCodes, events, paymentMethods] = await Promise.all([
    prisma.contact.findMany({ orderBy: { lastName: "asc" }, select: { id: true, firstName: true, lastName: true } }),
    prisma.campaign.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, ledgerCodeId: true } }),
    prisma.ledgerCode.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.event.findMany({
      where: { status: { not: "CANCELLED" } },
      orderBy: { startDate: "desc" },
      select: { id: true, name: true },
    }),
    prisma.paymentMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  async function addDonation(formData: FormData) {
    "use server";
    const session = await requireAuth();

    // Verify bank doc is still open
    const doc = await prisma.bankDocument.findUnique({ where: { id }, select: { status: true } });
    if (!doc || doc.status !== "OPEN") return;

    const amount = parseFloat(formData.get("amount") as string);
    const isGiftAidable = (formData.get("isGiftAidable") as string) === "on";
    const campaignId = (formData.get("campaignId") as string) || null;

    const donation = await prisma.donation.create({
      data: {
        contactId: formData.get("contactId") as string,
        amount,
        currency: "GBP",
        type: formData.get("type") as string,
        method: (formData.get("method") as string) || null,
        reference: (formData.get("reference") as string) || null,
        date: new Date(formData.get("date") as string),
        ledgerCodeId: (formData.get("ledgerCodeId") as string) || null,
        campaignId,
        eventId: (formData.get("eventId") as string) || null,
        isGiftAidable,
        notes: (formData.get("notes") as string) || null,
        bankDocumentId: id,
        createdById: session.id,
      },
    });

    if (campaignId) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { actualRaised: { increment: amount } },
      });
    }

    await logAudit({ userId: session.id, action: "CREATE", entityType: "Donation", entityId: donation.id, details: { amount, bankDocRef: id } });

    revalidatePath(`/finance/bank-documents/${id}`);
    redirect(`/finance/bank-documents/${id}`);
  }

  async function submitDoc() {
    "use server";
    const session = await requireAuth();
    await prisma.bankDocument.update({ where: { id }, data: { status: "SUBMITTED" } });
    await logAudit({ userId: session.id, action: "UPDATE", entityType: "BankDocument", entityId: id, details: { status: "SUBMITTED" } });
    revalidatePath(`/finance/bank-documents/${id}`);
    revalidatePath("/finance/bank-documents");
    redirect(`/finance/bank-documents/${id}`);
  }

  async function closeDoc() {
    "use server";
    const session = await requireAuth();
    await prisma.bankDocument.update({ where: { id }, data: { status: "CLOSED" } });
    await logAudit({ userId: session.id, action: "UPDATE", entityType: "BankDocument", entityId: id, details: { status: "CLOSED" } });
    revalidatePath(`/finance/bank-documents/${id}`);
    revalidatePath("/finance/bank-documents");
    redirect(`/finance/bank-documents/${id}`);
  }

  async function reopenDoc() {
    "use server";
    const session = await requireAuth();
    await prisma.bankDocument.update({ where: { id }, data: { status: "OPEN" } });
    await logAudit({ userId: session.id, action: "UPDATE", entityType: "BankDocument", entityId: id, details: { status: "REOPENED" } });
    revalidatePath(`/finance/bank-documents/${id}`);
    revalidatePath("/finance/bank-documents");
    redirect(`/finance/bank-documents/${id}`);
  }

  const total = bankDoc.donations.reduce((sum, d) => sum + d.amount, 0);
  const statusColors: Record<string, string> = {
    OPEN: "bg-blue-100 text-blue-800",
    SUBMITTED: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-green-100 text-green-800",
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/bank-documents" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{bankDoc.reference}</h1>
            <Badge className={statusColors[bankDoc.status]}>{bankDoc.status}</Badge>
          </div>
          <p className="text-gray-500 mt-1">
            {formatDate(bankDoc.date)} &middot; Created by {bankDoc.createdBy.name} &middot; {bankDoc.donations.length} items &middot; £{total.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-2">
          {bankDoc.status === "OPEN" && (
            <form action={submitDoc}>
              <Button type="submit" variant="outline" className="gap-2">
                <CheckCircle className="h-4 w-4" /> Submit for Review
              </Button>
            </form>
          )}
          {bankDoc.status === "SUBMITTED" && (
            <>
              <form action={reopenDoc}>
                <Button type="submit" variant="outline" className="gap-2">Reopen</Button>
              </form>
              <form action={closeDoc}>
                <Button type="submit" className="gap-2">
                  <Lock className="h-4 w-4" /> Close
                </Button>
              </form>
            </>
          )}
          {bankDoc.status === "CLOSED" && (
            <form action={reopenDoc}>
              <Button type="submit" variant="outline" className="gap-2">Reopen</Button>
            </form>
          )}
        </div>
      </div>

      {/* Donations in this bank document */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Donations ({bankDoc.donations.length})</h3>
        </CardHeader>
        <CardContent>
          {bankDoc.donations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No donations recorded yet. Use the form below to add donations to this bank document.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ledger</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Gift Aid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bankDoc.donations.map((d, i) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 text-sm">
                        <Link href={`/finance/donations/${d.id}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
                          {d.contact.firstName} {d.contact.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(d.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{d.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{d.method || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{d.ledgerCode ? `${d.ledgerCode.code}` : "—"}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">£{d.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        {d.isGiftAidable ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">Total</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">£{total.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add donation form — only when open */}
      {isOpen && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Plus className="h-5 w-5" /> Add Donation to Bank Document
            </h3>
          </CardHeader>
          <CardContent>
            <form action={addDonation} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <SearchableSelect
                    name="contactId"
                    required
                    placeholder="Search contacts..."
                    options={contacts.map((c) => ({
                      value: c.id,
                      label: `${c.firstName} ${c.lastName}`,
                    }))}
                  />
                </div>
                <Input label="Date" name="date" type="date" required defaultValue={today} />
                <Input label="Amount (£)" name="amount" type="number" step="0.01" required />
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                  label="Payment Method"
                  name="method"
                  placeholder="Select method"
                  options={paymentMethods.map((pm) => ({
                    value: pm.name,
                    label: pm.name,
                  }))}
                />
                <Input label="Reference" name="reference" placeholder="Receipt / cheque no." />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Select
                  label="Ledger Code"
                  name="ledgerCodeId"
                  placeholder="Select code"
                  options={ledgerCodes.map((code) => ({
                    value: code.id,
                    label: `${code.code} - ${code.name}`,
                  }))}
                />
                <Select
                  label="Campaign"
                  name="campaignId"
                  placeholder="Select campaign"
                  options={campaigns.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                />
                <Select
                  label="Event"
                  name="eventId"
                  placeholder="Select event"
                  options={events.map((e) => ({
                    value: e.id,
                    label: e.name,
                  }))}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isGiftAidable" name="isGiftAidable" className="rounded border-gray-300" />
                  <label htmlFor="isGiftAidable" className="text-sm font-medium text-gray-700">Gift Aid Eligible</label>
                </div>
                <div className="flex-1">
                  <Input label="" name="notes" placeholder="Notes (optional)" />
                </div>
                <Button type="submit" className="gap-2 self-end">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!isOpen && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-lg text-sm">
          <Lock className="h-4 w-4 text-amber-600" />
          <span className="text-amber-700">This bank document is {bankDoc.status.toLowerCase()}. Reopen it to add or modify donations.</span>
        </div>
      )}
    </div>
  );
}
