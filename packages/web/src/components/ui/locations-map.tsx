"use client";

import { GoogleMap } from "./google-map";

interface LocationData {
  id: string;
  name: string;
  address: string | null;
  type: string;
  latitude: number | null;
  longitude: number | null;
  activeTins: number;
  totalCollected: number;
}

export function LocationsMap({ locations }: { locations: LocationData[] }) {
  const mappable = locations.filter(
    (l): l is LocationData & { latitude: number; longitude: number } =>
      l.latitude !== null && l.longitude !== null
  );

  if (mappable.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 h-[400px]">
        <div className="text-center px-4">
          <p className="text-sm text-gray-500">
            No locations have coordinates yet. Add addresses to locations to see
            them on the map.
          </p>
        </div>
      </div>
    );
  }

  const markers = mappable.map((loc) => ({
    id: loc.id,
    lat: loc.latitude,
    lng: loc.longitude,
    title: loc.name,
    label: loc.type,
    info: `${loc.activeTins} active tin${loc.activeTins !== 1 ? "s" : ""} · £${loc.totalCollected.toFixed(2)} collected${loc.address ? `<br/>${loc.address}` : ""}`,
    href: `/finance/collection-tins/locations/${loc.id}`,
  }));

  return <GoogleMap markers={markers} height="400px" />;
}
