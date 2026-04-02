"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type ImportRow = {
  tinNumber?: string;
  name: string;
  address?: string;
  city?: string;
  postcode?: string;
  type?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
};

export type ImportResult = {
  locationsCreated: number;
  tinsCreated: number;
  tinsSkipped: number;
  rowsSkipped: number;
  errors: string[];
};

const VALID_TYPES = ["SHOP", "PUB", "RESTAURANT", "OFFICE", "SCHOOL", "CHURCH", "OTHER"];

function derivePostcodeArea(postcode: string): string | null {
  if (!postcode) return null;
  const clean = postcode.trim().toUpperCase();
  const match = clean.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)\s*(\d)/);
  if (match) return `${match[1]} ${match[2]}`;
  return clean.split(" ")[0] || null;
}

function normaliseType(raw?: string): string {
  if (!raw) return "OTHER";
  const upper = raw.trim().toUpperCase();
  if (VALID_TYPES.includes(upper)) return upper;
  const mapped: Record<string, string> = {
    STORE: "SHOP", RETAIL: "SHOP", BAR: "PUB", INN: "PUB",
    CAFE: "RESTAURANT", TAKEAWAY: "RESTAURANT", FOOD: "RESTAURANT",
    WORK: "OFFICE", BUSINESS: "OFFICE", CHAPEL: "CHURCH",
    COLLEGE: "SCHOOL", ACADEMY: "SCHOOL", UNIVERSITY: "SCHOOL",
  };
  return mapped[upper] || "OTHER";
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

// Build a unique key for grouping rows into locations
function locationKey(name: string, postcode?: string): string {
  const n = name.trim().toLowerCase();
  const p = (postcode || "").trim().toLowerCase();
  return `${n}|||${p}`;
}

/**
 * Import handles two scenarios:
 *
 * 1. Tin-level CSV: Each row is a tin with a tin number. Multiple rows may share
 *    the same location (name + postcode). We group them, create one TinLocation
 *    per unique address, then create individual CollectionTin records.
 *
 * 2. Location-level CSV: No tin number column mapped. Each row is a unique
 *    location. We create TinLocations only (no tins).
 */
export async function importLocations(rows: ImportRow[]): Promise<ImportResult> {
  const session = await getSession();
  if (!session) return { locationsCreated: 0, tinsCreated: 0, tinsSkipped: 0, rowsSkipped: 0, errors: ["Not authenticated"] };

  const hasTinNumbers = rows.some((r) => r.tinNumber && r.tinNumber.trim().length > 0);
  let locationsCreated = 0;
  let tinsCreated = 0;
  let tinsSkipped = 0;
  let rowsSkipped = 0;
  const errors: string[] = [];

  // Group rows by location
  const locationGroups = new Map<string, { rows: ImportRow[]; indices: number[] }>();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.name || row.name.trim().length === 0) {
      errors.push(`Row ${i + 1}: Missing location name — skipped`);
      rowsSkipped++;
      continue;
    }

    const key = locationKey(row.name, row.postcode);
    if (!locationGroups.has(key)) {
      locationGroups.set(key, { rows: [], indices: [] });
    }
    locationGroups.get(key)!.rows.push(row);
    locationGroups.get(key)!.indices.push(i + 1);
  }

  // Process each unique location
  for (const [key, group] of locationGroups) {
    const firstRow = group.rows[0];
    const name = firstRow.name.trim();
    const postcode = firstRow.postcode?.trim() || null;
    const address = firstRow.address?.trim() || null;
    const city = firstRow.city?.trim() || null;
    const type = normaliseType(firstRow.type);

    // Check if location already exists in database
    let existingLocation = await prisma.tinLocation.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        ...(postcode ? { postcode: { equals: postcode, mode: "insensitive" } } : {}),
      },
    });

    let locationId: string;

    if (existingLocation) {
      locationId = existingLocation.id;
      // Location exists — don't re-create, just use it for tins
    } else {
      // Geocode the address
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
        const newLoc = await prisma.tinLocation.create({
          data: {
            name,
            address,
            city,
            postcode,
            postcodeArea: postcode ? derivePostcodeArea(postcode) : null,
            type,
            contactName: firstRow.contactName?.trim() || null,
            contactPhone: firstRow.contactPhone?.trim() || null,
            notes: firstRow.notes?.trim() || null,
            latitude,
            longitude,
            isActive: true,
          },
        });
        locationId = newLoc.id;
        locationsCreated++;
      } catch (e: any) {
        errors.push(`Location "${name}": failed to create — ${e.message?.slice(0, 80)}`);
        rowsSkipped += group.rows.length;
        continue;
      }
    }

    // If tin numbers are mapped, create CollectionTin records for each row
    if (hasTinNumbers) {
      for (let j = 0; j < group.rows.length; j++) {
        const row = group.rows[j];
        const rowNum = group.indices[j];
        const tinNum = row.tinNumber?.trim();

        if (!tinNum) {
          errors.push(`Row ${rowNum}: No tin number — skipped tin creation`);
          tinsSkipped++;
          continue;
        }

        // Check for duplicate tin number
        const existingTin = await prisma.collectionTin.findUnique({
          where: { tinNumber: tinNum },
        });

        if (existingTin) {
          errors.push(`Row ${rowNum}: Tin "${tinNum}" already exists — skipped`);
          tinsSkipped++;
          continue;
        }

        try {
          await prisma.collectionTin.create({
            data: {
              tinNumber: tinNum,
              locationName: name,
              locationAddress: [address, city, postcode].filter(Boolean).join(", ") || null,
              locationId,
              status: "DEPLOYED",
              deployedAt: new Date(),
              createdById: session.id,
            },
          });
          tinsCreated++;
        } catch (e: any) {
          errors.push(`Row ${rowNum}: Tin "${tinNum}" — ${e.message?.slice(0, 80)}`);
          tinsSkipped++;
        }
      }
    }
  }

  await logAudit({
    userId: session.id,
    action: "CREATE",
    entityType: "TinLocation",
    entityId: "csv-import",
    details: { locationsCreated, tinsCreated, tinsSkipped, rowsSkipped, errorCount: errors.length },
  });

  revalidatePath("/finance/collection-tins");
  return { locationsCreated, tinsCreated, tinsSkipped, rowsSkipped, errors };
}
