import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default async function DonationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const donation = await prisma.donation.findUnique({
    where: { id },
    include: {
      contact: true,
      campaign: true,
      event: true,
      ledgerCode: true,
      createdBy: true,
    },
  });

  if (!donation) notFound();

  async function deleteDonation() {
    "use server";
    const session = await requireAuth();

    await prisma.donation.delete({
      where: { id },
    });

    revalidatePath("/finance/donations");
    redirect("/finance/donations");
  }

  const typeColors: Record<string, string> = {
    DONATION: "bg-green-100 text-green-800",
    PAYMENT: "bg-blue-100 text-blue-800",
    GIFT: "bg-purple-100 text-purple-800",
    EVENT_FEE: "bg-yellow-100 text-yellow-800",
    SPONSORSHIP: "bg-orange-100 text-orange-800",
    LEGACY: "bg-indigo-100 text-indigo-800",
    GRANT: "bg-pink-100 text-pink-800",
    IN_KIND: "bg-gray-100 text-gray-800",
  };

  const statusColors: Record<string, string> = {
    RECEIVED: "bg-green-50 text-green-700",
    PENDING: "bg-yellow-50 text-yellow-700",
    REFUNDED: "bg-red-50 text-red-700",
    CANCELLED: "bg-gray-50 text-gray-700",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/donations" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Donation Details</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  £{donation.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</p>
                <Link
                  href={`/crm/contacts/${donation.contact.id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-1 block"
                >
                  {donation.contact.firstName} {donation.contact.lastName}
                </Link>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date</p>
                <p className="text-sm text-gray-900 mt-1">{formatDate(donation.date)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type</p>
                <div className="mt-1">
                  <Badge className={typeColors[donation.type]}>{donation.type}</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
                <div className="mt-1">
                  <Badge className={statusColors[donation.status]}>{donation.status}</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gift Aid
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {donation.isGiftAidable ? "Eligible" : "Not eligible"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-gray-100">
            <div className="space-y-4">
              {donation.method && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </p>
                  <p className="text-sm text-gray-900 mt-1">{donation.method}</p>
                </div>
              )}
              {donation.reference && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </p>
                  <p className="text-sm text-gray-900 mt-1 font-mono">{donation.reference}</p>
                </div>
              )}
              {donation.ledgerCode && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ledger Code
                  </p>
                  <p className="text-sm text-gray-900 mt-1">
                    {donation.ledgerCode.code} - {donation.ledgerCode.name}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {donation.campaign && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </p>
                  <Link
                    href={`/finance/campaigns/${donation.campaign.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 block"
                  >
                    {donation.campaign.name}
                  </Link>
                </div>
              )}
              {donation.event && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </p>
                  <Link
                    href={`/finance/events/${donation.event.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700 mt-1 block"
                  >
                    {donation.event.name}
                  </Link>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recorded by
                </p>
                <p className="text-sm text-gray-900 mt-1">{donation.createdBy.name}</p>
              </div>
            </div>
          </div>

          {donation.notes && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</p>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{donation.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/finance/donations">
          <Button variant="outline">Back</Button>
        </Link>
        <form action={deleteDonation}>
          <Button variant="destructive" type="submit">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </form>
      </div>
    </div>
  );
}
