import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewCampaignPage() {
  const ledgerCodes = await prisma.ledgerCode.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });

  async function createCampaign(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const budgetTarget = formData.get("budgetTarget") as string;

    const campaign = await prisma.campaign.create({
      data: {
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || null,
        type: (formData.get("type") as string) || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budgetTarget: budgetTarget ? parseFloat(budgetTarget) : null,
        ledgerCodeId: (formData.get("ledgerCodeId") as string) || null,
        createdById: session.id,
      },
    });

    redirect(`/dashboard/campaigns/${campaign.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/campaigns" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createCampaign} className="space-y-6">
            <Input label="Campaign Name" name="name" required />

            <Textarea label="Description" name="description" />

            <Select
              label="Campaign Type"
              name="type"
              options={[
                { value: "APPEAL", label: "Appeal" },
                { value: "MAIL", label: "Mail" },
                { value: "EMAIL", label: "Email" },
                { value: "EVENT", label: "Event" },
                { value: "LEGACY", label: "Legacy" },
                { value: "CORPORATE", label: "Corporate" },
                { value: "OTHER", label: "Other" },
              ]}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                name="startDate"
                type="datetime-local"
              />
              <Input
                label="End Date"
                name="endDate"
                type="datetime-local"
              />
            </div>

            <Input
              label="Budget Target (£)"
              name="budgetTarget"
              type="number"
              step="0.01"
              placeholder="Optional"
            />

            <Select
              label="Ledger Code"
              name="ledgerCodeId"
              placeholder="Select ledger code (optional)"
              options={ledgerCodes.map((code) => ({
                value: code.id,
                label: `${code.code} - ${code.name}`,
              }))}
            />

            <div className="flex justify-end gap-3">
              <Link href="/dashboard/campaigns">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">Create Campaign</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
