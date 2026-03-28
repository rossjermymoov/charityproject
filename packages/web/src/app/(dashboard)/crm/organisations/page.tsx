import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function OrganisationsPage() {
  const organisations = await prisma.organisation.findMany({
    include: { _count: { select: { contacts: true } } },
    orderBy: { name: "asc" },
  });

  async function createOrg(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.organisation.create({
      data: {
        name: formData.get("name") as string,
        type: (formData.get("type") as string) || null,
        website: (formData.get("website") as string) || null,
      },
    });
    redirect("/crm/organisations");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organisations</h1>
          <p className="text-gray-500 mt-1">Manage organisations linked to your contacts</p>
        </div>
      </div>

      {/* Quick add form */}
      <Card className="p-4">
        <form action={createOrg} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input name="name" required placeholder="Organisation name" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select name="type" className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select type</option>
              <option value="Corporate">Corporate</option>
              <option value="Foundation">Foundation</option>
              <option value="Government">Government</option>
              <option value="Charity">Charity</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input name="website" placeholder="https://..." className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <Button type="submit">
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        </form>
      </Card>

      {organisations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organisations"
          description="Add organisations to link them to contacts."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {organisations.map((org) => (
            <Card key={org.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-gray-100 p-2">
                  <Building2 className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{org.name}</h3>
                  {org.type && <p className="text-sm text-gray-500">{org.type}</p>}
                  <p className="text-sm text-gray-400 mt-1">
                    {org._count.contacts} contact{org._count.contacts !== 1 ? "s" : ""}
                  </p>
                  {org.website && (
                    <a href={org.website} target="_blank" rel="noopener" className="text-sm text-indigo-600 hover:underline mt-1 block">
                      {org.website}
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
