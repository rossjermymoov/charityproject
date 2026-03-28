import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

async function createLocation(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session) redirect("/login");

  const location = await prisma.tinLocation.create({
    data: {
      name: formData.get("name") as string,
      address: (formData.get("address") as string) || null,
      type: (formData.get("type") as string) || "OTHER",
      contactName: (formData.get("contactName") as string) || null,
      contactPhone: (formData.get("contactPhone") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  redirect(`/finance/collection-tins/locations/${location.id}`);
}

export default function NewTinLocationPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/finance/collection-tins/locations"
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Location</h1>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">
            Location Details
          </h3>
        </CardHeader>
        <CardContent>
          <form action={createLocation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Name *
              </label>
              <Input
                name="name"
                required
                placeholder="e.g. The Red Lion, Tesco Express High St"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <Input name="address" placeholder="Full address" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="type"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="SHOP">Shop</option>
                <option value="PUB">Pub</option>
                <option value="RESTAURANT">Restaurant</option>
                <option value="OFFICE">Office</option>
                <option value="SCHOOL">School</option>
                <option value="CHURCH">Church</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <Input
                  name="contactName"
                  placeholder="Who to speak to"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <Input name="contactPhone" placeholder="Phone number" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <Textarea
                name="notes"
                placeholder="Any additional details about this location..."
              />
            </div>
            <Button type="submit">Create Location</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
