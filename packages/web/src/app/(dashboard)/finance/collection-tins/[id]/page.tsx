import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

export default async function CollectionTinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tin = await prisma.collectionTin.findUnique({
    where: { id },
    include: {
      createdBy: true,
      movements: { orderBy: { date: "desc" } },
    },
  });

  if (!tin) notFound();

  async function updateStatus(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const newStatus = formData.get("status") as string;
    const notes = formData.get("notes") as string;

    const update: any = { status: newStatus };
    const currentTin = await prisma.collectionTin.findUnique({ where: { id } });

    if (newStatus === "DEPLOYED" && !currentTin?.deployedAt) {
      update.deployedAt = new Date();
    } else if (newStatus === "RETURNED" && !currentTin?.returnedAt) {
      update.returnedAt = new Date();
    }

    await prisma.collectionTin.update({
      where: { id },
      data: update,
    });

    if (notes) {
      await prisma.collectionTinMovement.create({
        data: {
          tinId: id,
          type: newStatus,
          date: new Date(),
          notes,
        },
      });
    }

    redirect(`/finance/collection-tins/${id}`);
  }

  async function addMovement(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.collectionTinMovement.create({
      data: {
        tinId: id,
        type: formData.get("type") as string,
        date: new Date(formData.get("date") as string),
        amount: formData.get("amount") ? parseFloat(formData.get("amount") as string) : null,
        notes: (formData.get("notes") as string) || null,
      },
    });

    redirect(`/finance/collection-tins/${id}`);
  }

  async function deleteTin() {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.collectionTin.delete({
      where: { id },
    });

    redirect("/finance/collection-tins");
  }

  const statusColors: Record<string, string> = {
    IN_STOCK: "bg-blue-100 text-blue-800",
    DEPLOYED: "bg-green-100 text-green-800",
    RETURNED: "bg-purple-100 text-purple-800",
    LOST: "bg-red-100 text-red-800",
    STOLEN: "bg-red-100 text-red-800",
    RETIRED: "bg-gray-100 text-gray-800",
  };

  const movementColors: Record<string, string> = {
    DEPLOYED: "bg-green-100 text-green-800",
    COLLECTED: "bg-blue-100 text-blue-800",
    COUNTED: "bg-purple-100 text-purple-800",
    LOST: "bg-red-100 text-red-800",
    STOLEN: "bg-red-100 text-red-800",
    RETURNED: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/collection-tins" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Tin Details</h1>
      </div>

      {/* Tin Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Tin Number</p>
              <p className="text-2xl font-bold text-gray-900">{tin.tinNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</p>
              <Badge className={statusColors[tin.status] || ""}>{tin.status}</Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Location</p>
              <p className="text-gray-900">{tin.locationName}</p>
              {tin.locationAddress && (
                <p className="text-sm text-gray-500">{tin.locationAddress}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Created By</p>
              <p className="text-gray-900">{tin.createdBy.name}</p>
              <p className="text-sm text-gray-500">{formatDate(tin.createdAt)}</p>
            </div>
            {tin.deployedAt && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Deployed</p>
                <p className="text-gray-900">{formatDate(tin.deployedAt)}</p>
              </div>
            )}
            {tin.returnedAt && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Returned</p>
                <p className="text-gray-900">{formatDate(tin.returnedAt)}</p>
              </div>
            )}
          </div>
          {tin.notes && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Notes</p>
              <p className="text-gray-700 whitespace-pre-wrap">{tin.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
        </CardHeader>
        <CardContent>
          <form action={updateStatus} className="space-y-4">
            <select
              name="status"
              defaultValue={tin.status}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="IN_STOCK">In Stock</option>
              <option value="DEPLOYED">Deployed</option>
              <option value="RETURNED">Returned</option>
              <option value="LOST">Lost</option>
              <option value="STOLEN">Stolen</option>
              <option value="RETIRED">Retired</option>
            </select>
            <Textarea name="notes" placeholder="Optional notes for this status change..." />
            <Button type="submit">Update Status</Button>
          </form>
        </CardContent>
      </Card>

      {/* Movement History */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Movement History</h3>
        </CardHeader>
        <CardContent>
          {tin.movements.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No movements recorded yet</p>
          ) : (
            <div className="space-y-3">
              {tin.movements.map((movement) => (
                <div key={movement.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <Badge className={movementColors[movement.type] || ""}>{movement.type}</Badge>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{formatDate(movement.date)}</p>
                    {movement.amount && (
                      <p className="text-sm font-medium text-gray-900">£{movement.amount.toFixed(2)}</p>
                    )}
                    {movement.notes && (
                      <p className="text-sm text-gray-600 mt-1">{movement.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Movement */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Record Movement</h3>
        </CardHeader>
        <CardContent>
          <form action={addMovement} className="space-y-4">
            <select
              name="type"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="DEPLOYED">Deployed</option>
              <option value="COLLECTED">Collected</option>
              <option value="COUNTED">Counted</option>
              <option value="LOST">Lost</option>
              <option value="STOLEN">Stolen</option>
              <option value="RETURNED">Returned</option>
            </select>
            <Input
              label="Date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
            <Input
              label="Amount Collected (optional)"
              name="amount"
              type="number"
              step="0.01"
              placeholder="£0.00"
            />
            <Textarea name="notes" placeholder="Additional notes..." />
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Record Movement
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delete Tin */}
      <div className="flex justify-end">
        <form action={deleteTin}>
          <Button type="submit" variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Tin
          </Button>
        </form>
      </div>
    </div>
  );
}
