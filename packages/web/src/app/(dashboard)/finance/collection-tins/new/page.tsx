import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { logAudit } from "@/lib/audit";
import { geocodeAddress } from "@/lib/geocode";

export default async function NewCollectionTinPage() {
  const locations = await prisma.tinLocation.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  async function createTin(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const existingLocationId = (formData.get("locationId") as string) || null;
    const newLocationName = (formData.get("newLocationName") as string)?.trim() || null;
    const newLocationAddress = (formData.get("newLocationAddress") as string)?.trim() || null;
    const newLocationType = (formData.get("newLocationType") as string) || "OTHER";

    let locationId: string | null = existingLocationId;
    let locationName = "";
    let locationAddress: string | null = null;

    if (existingLocationId) {
      // Using an existing location
      const loc = await prisma.tinLocation.findUnique({
        where: { id: existingLocationId },
      });
      if (loc) {
        locationName = loc.name;
        locationAddress = loc.address;
      }
    } else if (newLocationName) {
      // Auto-create a new TinLocation from the entered details with geocoding
      let latitude: number | null = null;
      let longitude: number | null = null;
      if (newLocationAddress) {
        const coords = await geocodeAddress(newLocationAddress);
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lng;
        }
      }
      const newLoc = await prisma.tinLocation.create({
        data: {
          name: newLocationName,
          address: newLocationAddress,
          type: newLocationType,
          latitude,
          longitude,
        },
      });
      locationId = newLoc.id;
      locationName = newLoc.name;
      locationAddress = newLoc.address;
      await logAudit({ userId: session.id, action: "CREATE", entityType: "TinLocation", entityId: newLoc.id, details: { name: newLocationName, autoCreated: true } });
    }

    const tin = await prisma.collectionTin.create({
      data: {
        tinNumber: formData.get("tinNumber") as string,
        locationName,
        locationAddress,
        locationId,
        notes: (formData.get("notes") as string) || null,
        status: "IN_STOCK",
        createdById: session.id,
      },
    });

    await logAudit({ userId: session.id, action: "CREATE", entityType: "CollectionTin", entityId: tin.id, details: { tinNumber: formData.get("tinNumber"), locationId } });
    redirect(`/finance/collection-tins/${tin.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/finance/collection-tins"
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Add Collection Tin
        </h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createTin} className="space-y-6">
            <Input
              label="Tin Number"
              name="tinNumber"
              placeholder="e.g., TIN-001"
              required
            />

            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Location</h3>
              <p className="text-xs text-gray-500">
                Choose an existing location or enter new details to create one automatically.
              </p>

              {locations.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Existing Location
                  </label>
                  <SearchableSelect
                    name="locationId"
                    placeholder="Search locations..."
                    options={locations.map((loc) => ({
                      value: loc.id,
                      label: `${loc.name}${loc.type !== "OTHER" ? ` (${loc.type})` : ""}`,
                    }))}
                  />
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-500">or create new</span>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  label="New Location Name"
                  name="newLocationName"
                  placeholder="e.g., The Red Lion Pub"
                />
                <Input
                  label="Address"
                  name="newLocationAddress"
                  placeholder="Full address (optional)"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Type
                  </label>
                  <select
                    name="newLocationType"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="OTHER">Other</option>
                    <option value="SHOP">Shop</option>
                    <option value="PUB">Pub</option>
                    <option value="RESTAURANT">Restaurant</option>
                    <option value="OFFICE">Office</option>
                    <option value="SCHOOL">School</option>
                    <option value="CHURCH">Church</option>
                  </select>
                </div>
              </div>
            </div>

            <Textarea
              label="Notes"
              name="notes"
              placeholder="Additional notes (optional)"
            />
            <div className="flex justify-end gap-3">
              <Link href="/finance/collection-tins">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">Create Tin</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
