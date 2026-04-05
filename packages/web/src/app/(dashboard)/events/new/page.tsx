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

export default async function NewEventPage() {
  const [campaigns, ledgerCodes, eventTypes] = await Promise.all([
    prisma.campaign.findMany({ orderBy: { name: "asc" } }),
    prisma.ledgerCode.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.eventType.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  async function createEvent(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    const event = await prisma.event.create({
      data: {
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || null,
        eventTypeId: (formData.get("eventTypeId") as string) || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location: (formData.get("location") as string) || null,
        capacity: formData.get("capacity") ? parseInt(formData.get("capacity") as string) : null,
        campaignId: (formData.get("campaignId") as string) || null,
        ledgerCodeId: (formData.get("ledgerCodeId") as string) || null,
        createdById: session.id,
      },
    });

    redirect(`/events/${event.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/events" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createEvent} className="space-y-6">
            <Input label="Event Name" name="name" required />

            <Textarea label="Description" name="description" />

            <Select
              label="Event Type"
              name="eventTypeId"
              placeholder="Select event type"
              options={eventTypes.map((et) => ({
                value: et.id,
                label: et.name,
              }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                name="startDate"
                type="datetime-local"
                required
              />
              <Input
                label="End Date"
                name="endDate"
                type="datetime-local"
              />
            </div>

            <Input label="Location" name="location" />

            <Input
              label="Capacity"
              name="capacity"
              type="number"
              placeholder="Optional"
            />

            <Select
              label="Campaign"
              name="campaignId"
              placeholder="Select campaign (optional)"
              options={campaigns.map((campaign) => ({
                value: campaign.id,
                label: campaign.name,
              }))}
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
              <Link href="/events">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">Create Event</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
