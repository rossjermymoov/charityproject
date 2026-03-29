import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/geocode";

export async function POST() {
  // Find all locations with addresses but no coordinates
  const locations = await prisma.tinLocation.findMany({
    where: {
      address: { not: null },
      OR: [{ latitude: null }, { longitude: null }],
    },
  });

  const results: { id: string; name: string; status: string }[] = [];

  for (const loc of locations) {
    if (!loc.address) continue;

    const coords = await geocodeAddress(loc.address);
    if (coords) {
      await prisma.tinLocation.update({
        where: { id: loc.id },
        data: { latitude: coords.lat, longitude: coords.lng },
      });
      results.push({ id: loc.id, name: loc.name, status: "geocoded" });
    } else {
      results.push({ id: loc.id, name: loc.name, status: "failed" });
    }

    // Small delay to avoid hitting rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  return NextResponse.json({
    total: locations.length,
    geocoded: results.filter((r) => r.status === "geocoded").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  });
}
