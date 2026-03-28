import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

export default async function GiftAidDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const giftAid = await prisma.giftAid.findUnique({
    where: { id },
    include: {
      contact: true,
      createdBy: true,
    },
  });

  if (!giftAid) notFound();

  async function updateStatus(formData: FormData) {
    "use server";
    const session = await requireAuth();

    await prisma.giftAid.update({
      where: { id },
      data: {
        status: formData.get("status") as string,
      },
    });

    revalidatePath(`/dashboard/finance/gift-aid/${id}`);
  }

  async function deleteGiftAid() {
    "use server";
    const session = await requireAuth();

    await prisma.giftAid.delete({
      where: { id },
    });

    revalidatePath("/dashboard/finance/gift-aid");
    redirect("/dashboard/finance/gift-aid");
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    EXPIRED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/finance/gift-aid" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Gift Aid Declaration</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </p>
                <Link
                  href={`/dashboard/crm/contacts/${giftAid.contact.id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-1 block"
                >
                  {giftAid.contact.firstName} {giftAid.contact.lastName}
                </Link>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Declaration Date
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(giftAid.declarationDate)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </p>
                <p className="text-sm text-gray-900 mt-1">{formatDate(giftAid.startDate)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {giftAid.endDate ? formatDate(giftAid.endDate) : "Ongoing"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </p>
                <div className="mt-1">
                  <Badge className={statusColors[giftAid.status]}>{giftAid.status}</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recorded by
                </p>
                <p className="text-sm text-gray-900 mt-1">{giftAid.createdBy.name}</p>
              </div>
            </div>
          </div>

          {giftAid.notes && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</p>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{giftAid.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status update */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
        </CardHeader>
        <CardContent>
          <form action={updateStatus} className="flex items-end gap-4">
            <div className="flex-1">
              <Select
                label="Status"
                name="status"
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "EXPIRED", label: "Expired" },
                  { value: "CANCELLED", label: "Cancelled" },
                ]}
              />
            </div>
            <Button type="submit">Update</Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/dashboard/finance/gift-aid">
          <Button variant="outline">Back</Button>
        </Link>
        <form action={deleteGiftAid}>
          <Button variant="destructive" type="submit">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </form>
      </div>
    </div>
  );
}
