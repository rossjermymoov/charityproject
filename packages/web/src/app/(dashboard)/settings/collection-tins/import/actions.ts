"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type ImportRow = {
  name: string;
  address?: string;
  city?: string;
  postcode?: string;
  type?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
};

const VALID_TYPES = ["SHOP", "PUB", "RESTAURANT", "OFFICE", "SCHOOL", "CHURCH", "OTHER"];

function derivePostcodeArea(postcode: string): string | null {
  if (!postcode) return null;
  // UK postcode: take outward code + first digit of inward (e.g. "SY11 4" from "SY11 4FN")
  const clean = postcode.trim().toUpperCase();
  const match = clean.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)\s*(\d)/);
  if (match) return `${match[1]} ${match[2]}`;
  return clean.split(" ")[0] || null;
}

// Geocode a single address using OpenStreetMap Nominatim
async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=gb`,
      { headers: { "User-Agent": "CharityOS/1.0" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.error("Geocoding failed for:", address, e);
  }
  return null;
}

export async function importLocations(rows: ImportRow[]): Promise<{ created: number; skipped: number; errors: string[] }> {
  const session = await getSession();
  if (!session) return { created: 0, skipped: 0, errors: ["Not authenticated"] };

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (!row.name || row.name.trim().length === 0) {
      errors.push(`Row ${i + 1}: Missing location name — skipped`);
      skipped++;
      continue;
    }

    const name = row.name.trim();
    const postcode = row.postcode?.trim() || null;
    const address = row.address?.trim() || null;
    const city = row.city?.trim() || null;

    // Normalise type
    let type = "OTHER";
    if (row.type) {
      const upper = row.type.trim().toUpperCase();
      if (VALID_TYPES.includes(upper)) {
        type = upper;
      } else {
        // Try fuzzy matching
        const mapped: Record<string, string> = {
          "STORE": "SHOP", "RETAIL": "SHOP", "BAR": "PUB", "INN": "PUB",
          "CAFE": "RESTAURANT", "TAKEAWAY": "RESTAURANT", "FOOD": "RESTAURANT",
          "WORK": "OFFICE", "BUSINESS": "OFFICE", "CHAPEL": "CHURCH",
          "COLLEGE": "SCHOOL", "ACADEMY": "SCHOOL", "UNIVERSITY": "SCHOOL",
        };
        type = mapped[upper] || "OTHER";
      }
    }

    // Check for duplicate by name + postcode
    const existing = await prisma.tinLocation.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        ...(postcode ? { postcode: { equals: postcode, mode: "insensitive" } } : {}),
      },
    });

    if (existing) {
      errors.push(`Row ${i + 1}: "${name}" already exists — skipped`);
      skipped++;
      continue;
    }

    // Geocode if we have address info
    let latitude: number | null = null;
    let longitude: number | null = null;
    const fullAddress = [address, city, postcode].filter(Boolean).join(", ");
    if (fullAddress) {
      const geo = await geocode(fullAddress);
      if (geo) {
        latitude = geo.lat;
        longitude = geo.lng;
      }
      // Rate limit: Nominatim asks for max 1 req/sec
      await new Promise((r) => setTimeout(r, 1100));
    }

    try {
      await prisma.tinLocation.create({
        data: {
          name,
          address,
          city,
          postcode,
          postcodeArea: postcode ? derivePostcodeArea(postcode) : null,
          type,
          contactName: row.contactName?.trim() || null,
          contactPhone: row.contactPhone?.trim() || null,
          notes: row.notes?.trim() || null,
          latitude,
          longitude,
          isActive: true,
        },
      });
      created++;
    } catch (e: any) {
      errors.push(`Row ${i + 1}: "${name}" — ${e.message?.slice(0, 80)}`);
      skipped++;
    }
  }

  await logAudit({
    userId: session.id,
    action: "CREATE",
    entityType: "TinLocation",
    entityId: "csv-import",
    details: { created, skipped, errorCount: errors.length },
  });

  revalidatePath("/finance/collection-tins");
  return { created, skipped, errors };
}
