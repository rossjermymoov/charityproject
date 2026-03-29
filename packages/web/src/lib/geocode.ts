/**
 * Geocode an address using the Google Maps Geocoding API.
 * Returns { lat, lng } or null if geocoding fails.
 * Uses the server-side GOOGLE_MAPS_API_KEY (not the public one).
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || !address.trim()) return null;

  try {
    const encoded = encodeURIComponent(address.trim());
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}&region=gb`,
      { cache: "no-store" }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (data.status === "OK" && data.results?.[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }

    return null;
  } catch {
    console.error("Geocoding failed for address:", address);
    return null;
  }
}
