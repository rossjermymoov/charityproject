import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewLegacyPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { lastName: "asc" },
  });

  async function createLegacy(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const estimatedAmount = formData.get("estimatedAmount") as string;
    const dateNotified = formData.get("dateNotified") as string;

    const legacy = await prisma.legacy.create({
      data: {
        deceasedName: formData.get("deceasedName") as string,
        contactId: (formData.get("contactId") as string) || null,
        type: (formData.get("type") as string) || "PECUNIARY",
        status: "NOTIFIED",
        estimatedAmount: estimatedAmount ? parseFloat(estimatedAmount) : null,
        dateNotified: dateNotified ? new Date(dateNotified) : new Date(),
        solicitorName: (formData.get("solicitorName") as string) || null,
        solicitorFirm: (formData.get("solicitorFirm") as string) || null,
        solicitorEmail: (formData.get("solicitorEmail") as string) || null,
        solicitorPhone: (formData.get("solicitorPhone") as string) || null,
        executorName: (formData.get("executorName") as string) || null,
        executorEmail: (formData.get("executorEmail") as string) || null,
        executorPhone: (formData.get("executorPhone") as string) || null,
        description: (formData.get("description") as string) || null,
        notes: (formData.get("notes") as string) || null,
        createdById: session.id,
      },
    });

    revalidatePath("/finance/legacies");
    redirect(`/finance/legacies/${legacy.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/legacies" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Legacy</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createLegacy} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Deceased Name"
                name="deceasedName"
                placeholder="Full name of deceased"
                required
              />
              <Select
                label="Legacy Type"
                name="type"
                defaultValue="PECUNIARY"
                options={[
                  { value: "PECUNIARY", label: "Pecuniary" },
                  { value: "RESIDUARY", label: "Residuary" },
                  { value: "SPECIFIC", label: "Specific" },
                  { value: "REVERSIONARY", label: "Reversionary" },
                  { value: "LIFE_INTEREST", label: "Life Interest" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact (optional)</label>
                <SearchableSelect
                  name="contactId"
                  placeholder="Search or select contact..."
                  options={[
                    { value: "", label: "No contact" },
                    ...contacts.map((contact) => ({
                      value: contact.id,
                      label: `${contact.firstName} ${contact.lastName}`,
                    })),
                  ]}
                />
              </div>
              <Input
                label="Date Notified"
                name="dateNotified"
                type="date"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Estimated Amount"
                name="estimatedAmount"
                type="number"
                step="0.01"
                placeholder="£0.00 (optional)"
              />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <p className="text-sm font-semibold text-gray-900 mb-4">Executor Information</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Executor Name"
                  name="executorName"
                  placeholder="Name (optional)"
                />
                <Input
                  label="Executor Email"
                  name="executorEmail"
                  type="email"
                  placeholder="email@example.com (optional)"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 mt-4">
                <Input
                  label="Executor Phone"
                  name="executorPhone"
                  type="tel"
                  placeholder="Phone (optional)"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <p className="text-sm font-semibold text-gray-900 mb-4">Solicitor Information</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Solicitor Name"
                  name="solicitorName"
                  placeholder="Name (optional)"
                />
                <Input
                  label="Solicitor Firm"
                  name="solicitorFirm"
                  placeholder="Firm name (optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Input
                  label="Solicitor Email"
                  name="solicitorEmail"
                  type="email"
                  placeholder="email@firm.com (optional)"
                />
                <Input
                  label="Solicitor Phone"
                  name="solicitorPhone"
                  type="tel"
                  placeholder="Phone (optional)"
                />
              </div>
            </div>

            <Input
              label="Description"
              name="description"
              placeholder="Details about the legacy..."
            />

            <Input
              label="Notes"
              name="notes"
              placeholder="Additional notes..."
            />

            <div className="flex justify-end gap-3">
              <Link href="/finance/legacies">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">Create Legacy</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
