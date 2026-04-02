import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Sparkles, MapPin, Clock, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import GenerateClient from "./generate-client";

export default async function GenerateRoutesPage() {
  // Get stats to show the user
  const locationCount = await prisma.tinLocation.count({
    where: {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
      tins: { some: { status: "DEPLOYED" } },
    },
  });

  const tinCount = await prisma.collectionTin.count({
    where: { status: "DEPLOYED" },
  });

  // Get volunteers for optional assignment
  const volunteers = await prisma.volunteerProfile.findMany({
    where: { status: "ACTIVE" },
    include: { contact: { select: { firstName: true, lastName: true } } },
    orderBy: { contact: { lastName: "asc" } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/collection-tins/routes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Route Generator</h1>
          <p className="text-gray-500 mt-1">
            Automatically split all your tin locations into balanced collection routes
          </p>
        </div>
      </div>

      {/* Data summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-gray-400" />
            <p className="text-sm text-gray-500">Locations with Tins</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{locationCount}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Route className="h-4 w-4 text-gray-400" />
            <p className="text-sm text-gray-500">Deployed Tins</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{tinCount}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-gray-400" />
            <p className="text-sm text-gray-500">Est. per Route</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {locationCount > 0 ? `~${Math.round(locationCount / 5)} stops` : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">at 5 routes</p>
        </Card>
      </div>

      {locationCount === 0 ? (
        <Card className="p-8 text-center">
          <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No geocoded locations with deployed tins found.</p>
          <p className="text-sm text-gray-400 mt-1">
            Add tin locations with addresses first, then come back here to generate routes.
          </p>
        </Card>
      ) : (
        <GenerateClient locationCount={locationCount} tinCount={tinCount} />
      )}
    </div>
  );
}
