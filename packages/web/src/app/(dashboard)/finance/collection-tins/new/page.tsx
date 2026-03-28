import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewCollectionTinPage() {
  async function createTin(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const tin = await prisma.collectionTin.create({
      data: {
        tinNumber: formData.get("tinNumber") as string,
        locationName: formData.get("locationName") as string,
        locationAddress: (formData.get("locationAddress") as string) || null,
        notes: (formData.get("notes") as string) || null,
        status: "IN_STOCK",
        createdById: session.id,
      },
    });

    redirect(`/finance/collection-tins/${tin.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/collection-tins" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Collection Tin</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createTin} className="space-y-6">
            <Input label="Tin Number" name="tinNumber" placeholder="e.g., TIN-001" required />
            <Input label="Location Name" name="locationName" placeholder="e.g., Main Street Store" required />
            <Input label="Location Address" name="locationAddress" placeholder="Full address (optional)" />
            <Textarea label="Notes" name="notes" placeholder="Additional notes (optional)" />
            <div className="flex justify-end gap-3">
              <Link href="/finance/collection-tins">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit">Create Tin</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
