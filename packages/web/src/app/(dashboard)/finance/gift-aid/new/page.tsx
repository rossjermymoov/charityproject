import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewGiftAidPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { lastName: "asc" },
  });

  async function createGiftAid(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const endDate = formData.get("endDate") as string;

    const giftAid = await prisma.giftAid.create({
      data: {
        contactId: formData.get("contactId") as string,
        declarationDate: new Date(formData.get("declarationDate") as string),
        startDate: new Date(formData.get("startDate") as string),
        endDate: endDate ? new Date(endDate) : null,
        notes: (formData.get("notes") as string) || null,
        createdById: session.id,
      },
    });

    revalidatePath("/finance/gift-aid");
    redirect(`/finance/gift-aid/${giftAid.id}`);
  }

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

            <div className="grid grid-cols-2 gap-4">
              <Input label="Declaration Date" name="declarationDate" type="date" required />
              <Input label="Start Date" name="startDate" type="date" required />
            </div>

            <Input
              label="End Date (optional - leave blank for ongoing)"
              name="endDate"
              type="date"
              placeholder="Leave blank if ongoing"
            />

            <Input label="Notes" name="notes" placeholder="Additional notes..." />

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
