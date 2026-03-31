import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function EventsSettingsPage() {
  await requireRole(["ADMIN"]);

  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
  });

  async function saveTargets(formData: FormData) {
    "use server";
    await requireRole(["ADMIN"]);

    await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: {
        eventsIncomeTarget: parseFloat(formData.get("eventsIncomeTarget") as string) || null,
        eventsCostBudget: parseFloat(formData.get("eventsCostBudget") as string) || null,
        eventsProfitTarget: parseFloat(formData.get("eventsProfitTarget") as string) || null,
      },
      create: {
        id: "default",
        eventsIncomeTarget: parseFloat(formData.get("eventsIncomeTarget") as string) || null,
        eventsCostBudget: parseFloat(formData.get("eventsCostBudget") as string) || null,
        eventsProfitTarget: parseFloat(formData.get("eventsProfitTarget") as string) || null,
      },
    });

    revalidatePath("/settings/events");
    revalidatePath("/events");
    redirect("/settings/events");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events Settings</h1>
          <p className="text-gray-500 mt-1">Set annual targets for your events programme</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Target className="h-5 w-5" /> Annual Events Targets
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            These targets apply to the current financial year. All event income and costs will roll up into these figures on the events dashboard.
          </p>
          <form action={saveTargets} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Income Target (£)"
                name="eventsIncomeTarget"
                type="number"
                step="0.01"
                defaultValue={settings?.eventsIncomeTarget ?? ""}
                placeholder="e.g. 400000"
              />
              <Input
                label="Cost Budget (£)"
                name="eventsCostBudget"
                type="number"
                step="0.01"
                defaultValue={settings?.eventsCostBudget ?? ""}
                placeholder="e.g. 250000"
              />
              <Input
                label="Profit Target (£)"
                name="eventsProfitTarget"
                type="number"
                step="0.01"
                defaultValue={settings?.eventsProfitTarget ?? ""}
                placeholder="e.g. 150000"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Save Targets</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
