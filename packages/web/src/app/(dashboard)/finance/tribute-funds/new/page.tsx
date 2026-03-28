import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewTributeFundPage() {
  async function createFund(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const fund = await prisma.tributeFund.create({
      data: {
        name: formData.get("name") as string,
        type: formData.get("type") as string,
        inMemoryOf: (formData.get("inMemoryOf") as string) || null,
        description: (formData.get("description") as string) || null,
        status: "ACTIVE",
        createdById: session.id,
      },
    });

    redirect(`/finance/tribute-funds/${fund.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/tribute-funds" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Tribute Fund</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createFund} className="space-y-6">
            <Input label="Fund Name" name="name" placeholder="e.g., John's Memorial Fund" required />
            <Select
              label="Fund Type"
              name="type"
              options={[
                { value: "TRADITIONAL", label: "Traditional" },
                { value: "ROBIN", label: "Robin (Children's)" },
              ]}
            />
            <Input
              label="In Memory Of"
              name="inMemoryOf"
              placeholder="Name of person being remembered (optional)"
            />
            <Textarea
              label="Description"
              name="description"
              placeholder="Details about the fund (optional)"
            />
            <div className="flex justify-end gap-3">
              <Link href="/finance/tribute-funds">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit">Create Fund</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
