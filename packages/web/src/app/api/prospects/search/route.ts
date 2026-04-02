import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export type ProspectResult = {
  placeId: string;
  name: string;
  address: string;
  type: string;
  lat: number;
  lng: number;
  rating?: number;
  alreadyExists: boolean;
};

// Map Google place types to our location types
function mapPlaceType(types: string[]): string {
  if (types.includes("bar") || types.includes("night_club")) return "PUB";
  if (types.includes("restaurant") || types.includes("cafe") || types.includes("bakery") || types.includes("meal_takeaway")) return "RESTAURANT";
  if (types.includes("store") || types.includes("shopping_mall") || types.includes("supermarket") || types.includes("convenience_store") || types.includes("clothing_store") || types.includes("hardware_store") || types.includes("book_store") || types.includes("florist") || types.includes("jewelry_store") || types.includes("pet_store") || types.includes("shoe_store")) return "SHOP";
  if (types.includes("school") || types.includes("university") || types.includes("secondary_school") || types.includes("primary_school")) return "SCHOOL";
  if (types.includes("church") || types.includes("place_of_worship") || types.includes("mosque") || types.includes("synagogue")) return "CHURCH";
  if (types.includes("accounting") || types.includes("lawyer") || types.includes("real_estate_agency") || types.includes("insurance_agency") || types.includes("finance")) return "OFFICE";
  return "OTHER";
}

// The category queries we'll send to Google Places Text Search
const CATEGORY_QUERIES: Record<string, string> = {
  PUB: "pub",
  RESTAURANT: "restaurant OR cafe",
  SHOP: "shop OR store",
  SCHOOL: "school",
  CHURCH: "church",
  OFFICE: "office OR business",
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { category, postcode } = await request.json();
  if (!category || !postcode) {
    return NextResponse.json({ error: "category and postcode are required" }, { status: 400 });
  }

  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    select: { googlePlacesApiKey: true },
  });

  if (!settings?.googlePlacesApiKey) {
    return NextResponse.json({ error: "Google Places API key not configured. Go to Settings > Collection Tins to add it." }, { status: 400 });
  }

  const apiKey = settings.googlePlacesApiKey;
  const query = CATEGORY_QUERIES[category] || category.toLowerCase();
  const searchQuery = `${query} near ${postcode}, UK`;

  try {
    // Use Google Places Text Search API
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json({ error: `Google Places API error: ${data.status} — ${data.error_message || ""}` }, { status: 400 });
    }

    const places = data.results || [];

    // Get all existing location names for matching
    const existingLocations = await prisma.tinLocation.findMany({
      where: { isActive: true },
      select: { name: true, postcode: true },
    });

    const existingNames = new Set(
      existingLocations.map((l) => l.name.trim().toLowerCase())
    );

    const results: ProspectResult[] = places.map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address || "",
      type: mapPlaceType(place.types || []),
      lat: place.geometry?.location?.lat || 0,
      lng: place.geometry?.location?.lng || 0,
      rating: place.rating,
      alreadyExists: existingNames.has(place.name.trim().toLowerCase()),
    }));

    return NextResponse.json({ results, total: results.length });
  } catch (e: any) {
    return NextResponse.json({ error: `Search failed: ${e.message}` }, { status: 500 });
  }
}
