import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Sparkles, MapPin, Clock, Route, Building2, AlertTriangle } from "lucide-react";
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

  // Get head office setting
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    select: { headOfficeAddress: true, headOfficeLat: true, headOfficeLng: true },
  });
  const hasHeadOffice = !!(settings?.headOfficeLat && settings?.headOfficeLng);

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

      {/* Head office warning */}
      {!hasHeadOffice && (
        <Card className="p-4 border-amber-300 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Head office address not set</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Set your head office address in settings so routes can be optimised from your starting location.
              </p>
              <Link href="/settings/collection-tins">
                <Button variant="outline" size="sm" className="mt-2 border-amber-400 text-amber-800 hover:bg-amber-100">
                  Go to Settings
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Head office info */}
      {hasHeadOffice && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-800">Starting from: {settings!.headOfficeAddress || "Head Office"}</p>
              <p className="text-xs text-green-600 mt-0.5">Routes will be ordered starting nearest to your head office</p>
            </div>
          </div>
        </Card>
      )}

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
