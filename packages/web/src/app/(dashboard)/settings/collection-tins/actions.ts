"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateCollectionMode(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const mode = formData.get("collectionMode") as string;
  if (!["MY_ROUTES", "SUGGESTED_ROUTES"].includes(mode)) {
    throw new Error("Invalid collection mode");
  }

  await prisma.systemSettings.update({
    where: { id: "default" },
    data: { collectionMode: mode },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "SystemSettings",
    entityId: "default",
    details: { collectionMode: mode },
  });

  revalidatePath("/finance/collection-tins/routes");
  revalidatePath("/settings/collection-tins");
  redirect("/settings/collection-tins");
}

export async function updateHeadOffice(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const address = (formData.get("headOfficeAddress") as string)?.trim();
  if (!address) {
    throw new Error("Address is required");
  }

  // Geocode the address using OpenStreetMap Nominatim (free, no API key)
  let lat: number | null = null;
  let lng: number | null = null;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "User-Agent": "CharityOS/1.0" } }
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

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "SystemSettings",
    entityId: "default",
    details: { headOfficeAddress: address, geocoded: !!(lat && lng) },
  });

  revalidatePath("/finance/collection-tins/routes");
  revalidatePath("/settings/collection-tins");
  redirect("/settings/collection-tins");
}
