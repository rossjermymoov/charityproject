import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createRoute } from "../actions";

export default async function NewRoutePage() {
  const volunteers = await prisma.volunteerProfile.findMany({
    where: { status: "ACTIVE" },
    include: { contact: true },
    orderBy: { contact: { lastName: "asc" } },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/collection-tins/routes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Collection Route</h1>
          <p className="text-gray-500 mt-1">Plan a new tin collection route</p>
        </div>
      </div>

      <Card className="p-6">
        <form action={createRoute} className="space-y-4">
          <div>
            <Input label="Route Name" name="name" required placeholder="e.g. Round 1 - Town Centre" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Parking notes, road closures, areas to avoid..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Number of Tins" name="tinCount" type="number" min="0" defaultValue="50" />
            <Input label="Scheduled Date" name="scheduledDate" type="date" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Volunteer</label>
            <select name="assignedToId" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Unassigned</option>
              {volunteers.map(v => (
                <option key={v.id} value={v.id}>
                  {v.contact.firstName} {v.contact.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Link href="/finance/collection-tins/routes">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit">Create Route</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
