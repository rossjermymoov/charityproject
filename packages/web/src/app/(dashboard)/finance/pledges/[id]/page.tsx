import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { PledgeDetailClient } from "@/components/finance/pledge-detail-client";

export default async function PledgeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const pledge = await prisma.pledge.findUnique({
    where: { id },
    include: {
      contact: true,
      campaign: true,
      createdBy: { select: { id: true, name: true } },
      payments: {
        include: {
          donation: true,
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!pledge) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-blue-100 text-blue-800",
    FULFILLED: "bg-green-100 text-green-800",
    PARTIALLY_FULFILLED: "bg-yellow-100 text-yellow-800",
    CANCELLED: "bg-gray-100 text-gray-800",
    OVERDUE: "bg-red-100 text-red-800",
  };

  const frequencyLabels: Record<string, string> = {
    ONE_TIME: "One-time",
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    ANNUALLY: "Annually",
  };

  const outstandingAmount = Number(pledge.amount) - Number(pledge.totalFulfilled);
  const fulfillmentPercentage = Math.round(
    (Number(pledge.totalFulfilled) / Number(pledge.amount)) * 100
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/pledges">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {pledge.contact.firstName} {pledge.contact.lastName}'s Pledge
          </h1>
          <p className="text-gray-500 mt-1">
            Created on {formatDate(pledge.createdAt)} by {pledge.createdBy.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Pledge Overview
                  </h2>
                </div>
                <Badge className={statusColors[pledge.status] || ""}>
                  {pledge.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    £{pledge.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Frequency</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {frequencyLabels[pledge.frequency] || pledge.frequency}
                  </p>
                </div>
              </div>

              {pledge.campaign && (
                <div>
                  <p className="text-sm text-gray-600">Campaign</p>
                  <Link href={`/campaigns/${pledge.campaign.id}`}>
                    <p className="text-lg font-semibold text-indigo-600 hover:text-indigo-700">
                      {pledge.campaign.name}
                    </p>
                  </Link>
                </div>
              )}

              {pledge.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-gray-800 mt-1">{pledge.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Fulfillment Progress */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Fulfillment Progress
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {fulfillmentPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(fulfillmentPercentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Amount Pledged</p>
                  <p className="text-xl font-bold text-gray-900">
                    £{pledge.totalPledged.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount Fulfilled</p>
                  <p className="text-xl font-bold text-green-600">
                    £{pledge.totalFulfilled.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Outstanding</p>
                  <p
                    className={`text-xl font-bold ${
                      outstandingAmount > 0
                        ? "text-orange-600"
                        : "text-gray-500"
                    }`}
                  >
                    £{outstandingAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment History */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Payment History
              </h3>
              <PledgeDetailClient pledgeId={id} />
            </div>

            {pledge.payments.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No payments recorded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-gray-600 font-medium">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-gray-600 font-medium">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-gray-600 font-medium">
                        Donation
                      </th>
                      <th className="px-4 py-3 text-left text-gray-600 font-medium">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pledge.payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">
                          {formatDate(payment.date)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          £{payment.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {payment.donation ? (
                            <Link
                              href={`/finance/donations/${payment.donation.id}`}
                              className="text-indigo-600 hover:text-indigo-700"
                            >
                              {payment.donation.reference || payment.donation.id}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {payment.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contact Details
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <Link
                  href={`/crm/contacts/${pledge.contact.id}`}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  {pledge.contact.firstName} {pledge.contact.lastName}
                </Link>
              </div>

              {pledge.contact.email && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a
                    href={`mailto:${pledge.contact.email}`}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    {pledge.contact.email}
                  </a>
                </div>
              )}

              {pledge.contact.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <a
                    href={`tel:${pledge.contact.phone}`}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    {pledge.contact.phone}
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* Key Dates */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Key Dates
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="text-gray-900 font-semibold">
                  {formatDate(pledge.startDate)}
                </p>
              </div>

              {pledge.endDate && (
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="text-gray-900 font-semibold">
                    {formatDate(pledge.endDate)}
                  </p>
                </div>
              )}

              {pledge.nextReminderDate && (
                <div>
                  <p className="text-sm text-gray-600">Next Reminder</p>
                  <p className="text-gray-900 font-semibold">
                    {formatDate(pledge.nextReminderDate)}
                  </p>
                </div>
              )}

              {pledge.reminderFrequency && (
                <div>
                  <p className="text-sm text-gray-600">Reminder Frequency</p>
                  <p className="text-gray-900 font-semibold">
                    {pledge.reminderFrequency}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
