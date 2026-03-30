import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logAudit } from "@/lib/audit";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GiftAidForm } from "./gift-aid-form";

export default async function NewGiftAidPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { lastName: "asc" },
  });

  async function createGiftAid(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const endDate = formData.get("endDate") as string;
    const type = formData.get("type") as string;

    const giftAid = await prisma.giftAid.create({
      data: {
        contactId: formData.get("contactId") as string,
        type: type || "STANDARD",
        declarationDate: new Date(formData.get("declarationDate") as string),
        startDate: new Date(formData.get("startDate") as string),
        endDate: endDate ? new Date(endDate) : null,
        notes: (formData.get("notes") as string) || null,
        createdById: session.id,
      },
    });

    await logAudit({ userId: session.id, action: "CREATE", entityType: "GiftAid", entityId: giftAid.id, details: { contactId: formData.get("contactId"), type } });
    revalidatePath("/finance/gift-aid");
    redirect(`/finance/gift-aid/${giftAid.id}`);
  }

  const contactOptions = contacts.map((c) => ({
    value: c.id,
    label: `${c.firstName} ${c.lastName}`,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/gift-aid" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Gift Aid Declaration</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createGiftAid} className="space-y-6">
            <GiftAidForm contacts={contactOptions} action="" />

            <div className="flex justify-end gap-3">
              <Link href="/finance/gift-aid">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">Create Declaration</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
