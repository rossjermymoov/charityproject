import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Plus, Edit2, ToggleLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function MembershipTypesPage() {
  const session = await requireAuth();

  const membershipTypes = await prisma.membershipType.findMany({
    include: {
      _count: {
        select: { memberships: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  async function createType(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const duration = parseInt(formData.get("duration") as string);
    const benefitsStr = formData.get("benefits") as string;

    if (!name || isNaN(price) || isNaN(duration)) {
      throw new Error("Invalid input");
    }

    const benefits = benefitsStr ? benefitsStr.split(",").map((b) => b.trim()) : [];

    await prisma.membershipType.create({
      data: {
        name,
        description: description || null,
        price,
        duration,
        benefits: benefits.length > 0 ? JSON.stringify(benefits) : null,
        sortOrder: membershipTypes.length,
      },
    });

    revalidatePath("/finance/memberships/types");
  }

  async function toggleActive(typeId: string, currentActive: boolean) {
    "use server";
    await prisma.membershipType.update({
      where: { id: typeId },
      data: { isActive: !currentActive },
    });

    revalidatePath("/finance/memberships/types");
  }

  async function updatePrice(typeId: string, newPrice: number) {
    "use server";
    await prisma.membershipType.update({
      where: { id: typeId },
      data: { price: newPrice },
    });

    revalidatePath("/finance/memberships/types");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/memberships" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Membership Types</h1>
      </div>

      {/* Add New Type Form */}
      <Card className="rounded-lg">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Add New Membership Type</h3>
        </CardHeader>
        <CardContent>
          <form action={createType} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Annual Premium"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (£) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (months) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="duration"
                  required
                  min="1"
                  defaultValue="12"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="Optional description"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
              <input
                type="text"
                name="benefits"
                placeholder="Separate benefits with commas (e.g. Free newsletter, Members event access)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <Button type="submit" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Type
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Membership Types List */}
      {membershipTypes.length === 0 ? (
        <Card className="rounded-lg p-12 text-center">
          <p className="text-gray-500">No membership types created yet.</p>
        </Card>
      ) : (
        <Card className="rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {membershipTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{type.name}</p>
                        {type.description && (
                          <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                        )}
                        {type.benefits && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(JSON.parse(type.benefits) as string[]).map((benefit, idx) => (
                              <Badge
                                key={idx}
                                className="bg-blue-50 text-blue-700 text-xs"
                              >
                                {benefit}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      £{type.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {type.duration} months
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {type._count.memberships}
                    </td>
                    <td className="px-6 py-4">
                      {type.isActive ? (
                        <Badge className="bg-green-50 text-green-700">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-50 text-gray-700">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <form action={async () => await toggleActive(type.id, type.isActive)}>
                          <Button type="submit" variant="outline" size="sm">
                            {type.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
