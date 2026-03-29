import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { logAudit } from "@/lib/audit";
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

            <Select
              label="Declaration Type"
              name="type"
              required
              defaultValue="STANDARD"
              options={[
                { value: "STANDARD", label: "Standard Gift Aid" },
                { value: "RETAIL", label: "Retail Gift Aid" },
              ]}
            />

            {/* Declaration text preview */}
            <div className="rounded-lg border border-gray-200 p-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Standard Gift Aid Declaration</p>
                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    I want to Gift Aid my donation and any donations I make in the future or have made in the past 4 years to this charity. I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year it is my responsibility to pay any difference.
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Retail Gift Aid Declaration</p>
                <div className="bg-purple-50 border-l-4 border-purple-500 p-3">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    I want to Gift Aid the proceeds from the sale of any goods I donate to this charity. I authorise the charity to act as my agent in selling my donated goods, and I agree to a commission for this service. I confirm that I own the goods I am donating and I am not acting as a business in selling them. I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year it is my responsibility to pay any difference.
                  </p>
                </div>
              </div>
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
