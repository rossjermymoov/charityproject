import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Trash2, Pause, Play, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { logAudit } from "@/lib/audit";
import { formatDate } from "@/lib/utils";
import { ConfirmButton } from "@/components/ui/confirm-button";

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      contact: true,
      provider: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!subscription) notFound();

  async function updateSubscriptionStatus(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const current = await prisma.subscription.findUnique({ where: { id } });
    if (!current) return;

    const status = formData.get("status") as string;
    const updateData: any = { status };

    if (status === "CANCELLED") {
      updateData.cancelledAt = new Date();
    }

    await prisma.subscription.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId: session.id,
      action: "UPDATE",
      entityType: "Subscription",
      entityId: id,
      details: { status },
    });

    revalidatePath(`/finance/subscriptions/${id}`);
  }

  async function deleteSubscription() {
    "use server";
    const session = await requireAuth();

    await prisma.subscription.delete({
      where: { id },
    });

    await logAudit({
      userId: session.id,
      action: "DELETE",
      entityType: "Subscription",
      entityId: id,
    });

    revalidatePath("/finance/subscriptions");
    redirect("/finance/subscriptions");
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    PAUSED: "bg-yellow-100 text-yellow-800",
    CANCELLED: "bg-red-100 text-red-800",
    EXPIRED: "bg-gray-100 text-gray-800",
  };

  const frequencyColors: Record<string, string> = {
    WEEKLY: "bg-blue-100 text-blue-800",
    MONTHLY: "bg-indigo-100 text-indigo-800",
    QUARTERLY: "bg-purple-100 text-purple-800",
    ANNUALLY: "bg-pink-100 text-pink-800",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/subscriptions" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Details</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  £{subscription.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </p>
                <Link
                  href={`/crm/contacts/${subscription.contactId}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-1 block"
                >
                  {subscription.contact.firstName} {subscription.contact.lastName}
                </Link>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(subscription.startDate)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </p>
                <div className="mt-1">
                  <Badge
                    className={
                      frequencyColors[subscription.frequency] || "bg-gray-100 text-gray-800"
                    }
                  >
                    {subscription.frequency}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </p>
                <div className="mt-1">
                  <Badge className={statusColors[subscription.status] || "bg-gray-100 text-gray-800"}>
                    {subscription.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </p>
                <p className="text-sm text-gray-900 mt-1">{subscription.currency}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-gray-100">
            <div className="space-y-4">
              {subscription.nextPaymentDate && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Payment Date
                  </p>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDate(subscription.nextPaymentDate)}
                  </p>
                </div>
              )}
              {subscription.externalId && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider Reference
                  </p>
                  <p className="text-sm text-gray-900 mt-1 font-mono">{subscription.externalId}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {subscription.provider && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </p>
                  <p className="text-sm text-gray-900 mt-1">{subscription.provider.name}</p>
                </div>
              )}
              {subscription.cancelledAt && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cancelled At
                  </p>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDate(subscription.cancelledAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      {subscription.payments.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subscription.payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        £{payment.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          className={
                            payment.status === "SUCCEEDED"
                              ? "bg-green-100 text-green-800"
                              : payment.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        <Link href={`/finance/payments/${payment.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Status Form */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
        </CardHeader>
        <CardContent>
          <form action={updateSubscriptionStatus} className="space-y-6">
            <Select
              label="Status"
              name="status"
              required
              defaultValue={subscription.status}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "PAUSED", label: "Paused" },
                { value: "CANCELLED", label: "Cancelled" },
                { value: "EXPIRED", label: "Expired" },
              ]}
            />

            <div className="flex gap-3">
              {subscription.status === "PAUSED" && (
                <Button type="submit" name="status" value="ACTIVE">
                  <Play className="h-4 w-4 mr-2" />
                  Resume Subscription
                </Button>
              )}
              {subscription.status === "ACTIVE" && (
                <Button type="submit" name="status" value="PAUSED" variant="outline">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Subscription
                </Button>
              )}
              {subscription.status !== "CANCELLED" && (
                <Button type="submit" name="status" value="CANCELLED" variant="destructive">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Subscription
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/finance/subscriptions">
          <Button variant="outline">Back</Button>
        </Link>
        <form action={deleteSubscription}>
          <ConfirmButton
            message="Are you sure you want to delete this subscription?"
            variant="destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
