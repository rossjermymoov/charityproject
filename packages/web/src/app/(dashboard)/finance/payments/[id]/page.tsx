import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Trash2, RefreshCw, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { logAudit } from "@/lib/audit";
import { formatDate } from "@/lib/utils";
import { ConfirmButton } from "@/components/ui/confirm-button";

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      contact: true,
      provider: true,
    },
  });

  if (!payment) notFound();

  async function updatePaymentStatus(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const current = await prisma.payment.findUnique({ where: { id } });
    if (!current) return;

    const status = formData.get("status") as string;

    await prisma.payment.update({
      where: { id },
      data: {
        status,
        paidAt: status === "SUCCEEDED" ? new Date() : current.paidAt,
        refundedAt: status === "REFUNDED" ? new Date() : current.refundedAt,
      },
    });

    await logAudit({
      userId: session.id,
      action: "UPDATE",
      entityType: "Payment",
      entityId: id,
      details: { status },
    });

    revalidatePath(`/finance/payments/${id}`);
  }

  async function deletePayment() {
    "use server";
    const session = await requireAuth();

    await prisma.payment.delete({
      where: { id },
    });

    await logAudit({
      userId: session.id,
      action: "DELETE",
      entityType: "Payment",
      entityId: id,
    });

    revalidatePath("/finance/payments");
    redirect("/finance/payments");
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    SUCCEEDED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    REFUNDED: "bg-orange-100 text-orange-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  const typeColors: Record<string, string> = {
    ONE_OFF: "bg-blue-100 text-blue-800",
    SUBSCRIPTION: "bg-indigo-100 text-indigo-800",
    EVENT_FEE: "bg-yellow-100 text-yellow-800",
    MEMBERSHIP_FEE: "bg-pink-100 text-pink-800",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/payments" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
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
                  £{payment.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </p>
                <Link
                  href={`/crm/contacts/${payment.contactId}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-1 block"
                >
                  {payment.contact.firstName} {payment.contact.lastName}
                </Link>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </p>
                <p className="text-sm text-gray-900 mt-1">{formatDate(payment.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type</p>
                <div className="mt-1">
                  <Badge className={typeColors[payment.type] || "bg-gray-100 text-gray-800"}>
                    {payment.type.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </p>
                <div className="mt-1">
                  <Badge className={statusColors[payment.status] || "bg-gray-100 text-gray-800"}>
                    {payment.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </p>
                <p className="text-sm text-gray-900 mt-1">{payment.currency}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-gray-100">
            <div className="space-y-4">
              {payment.method && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </p>
                  <p className="text-sm text-gray-900 mt-1">{payment.method}</p>
                </div>
              )}
              {payment.paidAt && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid At
                  </p>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(payment.paidAt)}</p>
                </div>
              )}
              {payment.externalId && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider Reference
                  </p>
                  <p className="text-sm text-gray-900 mt-1 font-mono">{payment.externalId}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {payment.provider && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </p>
                  <p className="text-sm text-gray-900 mt-1">{payment.provider.name}</p>
                </div>
              )}
              {payment.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </p>
                  <p className="text-sm text-gray-900 mt-1">{payment.description}</p>
                </div>
              )}
              {payment.failureReason && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Failure Reason
                  </p>
                  <p className="text-sm text-red-600 mt-1">{payment.failureReason}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Status Form */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
        </CardHeader>
        <CardContent>
          <form action={updatePaymentStatus} className="space-y-6">
            <Select
              label="Status"
              name="status"
              required
              defaultValue={payment.status}
              options={[
                { value: "PENDING", label: "Pending" },
                { value: "SUCCEEDED", label: "Completed" },
                { value: "FAILED", label: "Failed" },
                { value: "REFUNDED", label: "Refunded" },
                { value: "CANCELLED", label: "Cancelled" },
              ]}
            />

            <Button type="submit">
              <CheckCircle className="h-4 w-4 mr-2" />
              Update Status
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/finance/payments">
          <Button variant="outline">Back</Button>
        </Link>
        <form action={deletePayment}>
          <ConfirmButton
            message="Are you sure you want to delete this payment?"
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
