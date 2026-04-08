import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logAudit } from "@/lib/audit";
import { formatDate } from "@/lib/utils";
import { BankDocDonations } from "./bank-doc-donations";

export default async function BankDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAuth();

  const bankDoc = await prisma.bankDocument.findUnique({
    where: { id },
    include: {
      createdBy: true,
      donations: {
        include: {
          contact: { select: { id: true, firstName: true, lastName: true, donorId: true } },
          ledgerCode: { select: { id: true, code: true, name: true } },
          campaign: { select: { id: true, name: true } },
          event: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!bankDoc) notFound();

  const [paymentMethods, ledgerCodes, campaigns, events] = await Promise.all([
    prisma.paymentMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.ledgerCode.findMany({ where: { isActive: true }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.campaign.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.event.findMany({ where: { status: { not: "CANCELLED" } }, orderBy: { startDate: "desc" }, select: { id: true, name: true } }),
  ]);

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
    CLOSED: "bg-green-100 text-green-800",
  };

  // Serialize donations for client component
  const donations = bankDoc.donations.map((d) => ({
    id: d.id,
    contactId: d.contact.id,
    contactName: `${d.contact.firstName} ${d.contact.lastName}`,
    donorId: d.contact.donorId,
    date: d.date.toISOString().split("T")[0],
    type: d.type,
    method: d.method || "",
    reference: d.reference || "",
    amount: d.amount,
    ledgerCodeId: d.ledgerCode?.id || "",
    ledgerCode: d.ledgerCode?.code || "",
    campaignId: d.campaign?.id || "",
    campaignName: d.campaign?.name || "",
    eventId: d.event?.id || "",
    eventName: d.event?.name || "",
    isGiftAidable: d.isGiftAidable,
    notes: d.notes || "",
  }));

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
            <form action={closeDoc}>
              <Button type="submit" className="gap-2">
                <Lock className="h-4 w-4" /> Close Bank Document
              </Button>
            </form>
          )}
          {bankDoc.status === "CLOSED" && (
            <form action={reopenDoc}>
              <Button type="submit" variant="outline" className="gap-2">Reopen</Button>
            </form>
          )}
        </div>
      </div>

      <BankDocDonations
        donations={donations}
        paymentMethods={paymentMethods}
        ledgerCodes={ledgerCodes}
        campaigns={campaigns}
        events={events}
      />
    </div>
  );
}
