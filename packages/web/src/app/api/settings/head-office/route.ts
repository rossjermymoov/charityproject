import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { address } = await request.json();
  if (!address || typeof address !== "string") {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  // Geocode using OpenStreetMap Nominatim
  let lat: number | null = null;
  let lng: number | null = null;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "User-Agent": "DeepCharity/1.0" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      lat = parseFloat(data[0].lat);
      lng = parseFloat(data[0].lon);
    }
  } catch (e) {
    console.error("Geocoding failed:", e);
  }

  await prisma.systemSettings.update({
    where: { id: "default" },
    data: {
      headOfficeAddress: address,
      headOfficeLat: lat,
      headOfficeLng: lng,
    },
  });

  return NextResponse.json({ address, lat, lng });
}
