"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Haversine distance in miles
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type LocPoint = {
  locationId: string;
  name: string;
  lat: number;
  lng: number;
  tinCount: number;
};

// K-means-style geographic clustering
function clusterLocations(locations: LocPoint[], k: number): LocPoint[][] {
  if (locations.length <= k) {
    return locations.map((l) => [l]);
  }

  // Initialise centroids by picking spread-out locations
  const centroids: { lat: number; lng: number }[] = [];
  // First centroid: northernmost location
  const sorted = [...locations].sort((a, b) => b.lat - a.lat);
  centroids.push({ lat: sorted[0].lat, lng: sorted[0].lng });

  // Remaining centroids: pick location farthest from existing centroids
  for (let i = 1; i < k; i++) {
    let bestIdx = 0;
    let bestDist = -1;
    for (let j = 0; j < locations.length; j++) {
      const minDist = Math.min(
        ...centroids.map((c) => haversine(locations[j].lat, locations[j].lng, c.lat, c.lng))
      );
      if (minDist > bestDist) {
        bestDist = minDist;
        bestIdx = j;
      }
    }
    centroids.push({ lat: locations[bestIdx].lat, lng: locations[bestIdx].lng });
  }

  // Iterate k-means (20 iterations max)
  let assignments = new Array(locations.length).fill(0);
  for (let iter = 0; iter < 20; iter++) {
    // Assign each location to nearest centroid
    const newAssignments = locations.map((loc) => {
      let minDist = Infinity;
      let minIdx = 0;
      for (let c = 0; c < centroids.length; c++) {
        const d = haversine(loc.lat, loc.lng, centroids[c].lat, centroids[c].lng);
        if (d < minDist) {
          minDist = d;
          minIdx = c;
        }
      }
      return minIdx;
    });

    // Check convergence
    if (JSON.stringify(newAssignments) === JSON.stringify(assignments)) break;
    assignments = newAssignments;

    // Recompute centroids
    for (let c = 0; c < k; c++) {
      const members = locations.filter((_, i) => assignments[i] === c);
      if (members.length > 0) {
        centroids[c] = {
          lat: members.reduce((s, m) => s + m.lat, 0) / members.length,
          lng: members.reduce((s, m) => s + m.lng, 0) / members.length,
        };
      }
    }
  }

  // Build clusters
  const clusters: LocPoint[][] = Array.from({ length: k }, () => []);
  assignments.forEach((c, i) => clusters[c].push(locations[i]));

  // Remove empty clusters
  return clusters.filter((c) => c.length > 0);
}

// Order stops within a cluster using nearest-neighbour
function orderByNearest(locations: LocPoint[]): LocPoint[] {
  if (locations.length <= 1) return locations;

  const ordered: LocPoint[] = [];
  const remaining = [...locations];

  // Start from the northernmost point
  remaining.sort((a, b) => b.lat - a.lat);
  ordered.push(remaining.shift()!);

  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversine(last.lat, last.lng, remaining[i].lat, remaining[i].lng);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    ordered.push(remaining.splice(nearestIdx, 1)[0]);
  }

  return ordered;
}

// Estimate route time: 5 min per stop + 3 min per mile
function estimateTime(orderedStops: LocPoint[]): number {
  let totalMiles = 0;
  for (let i = 1; i < orderedStops.length; i++) {
    totalMiles += haversine(
      orderedStops[i - 1].lat,
      orderedStops[i - 1].lng,
      orderedStops[i].lat,
      orderedStops[i].lng
    );
  }
  return orderedStops.length * 5 + totalMiles * 3; // minutes
}

export type GeneratedRoute = {
  name: string;
  stops: LocPoint[];
  totalMiles: number;
  estimatedMinutes: number;
  tinCount: number;
};

export type GeneratePreview = {
  routes: GeneratedRoute[];
  totalLocations: number;
  totalTins: number;
  avgStopsPerRoute: number;
  avgTimeMinutes: number;
};

export async function previewGenerateRoutes(formData: FormData): Promise<GeneratePreview | null> {
  const session = await getSession();
  if (!session) return null;

  const numRoutes = parseInt(formData.get("numRoutes") as string) || 5;

  // Fetch all active locations with geocodes that have deployed tins
  const locations = await prisma.tinLocation.findMany({
    where: {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
      tins: { some: { status: "DEPLOYED" } },
    },
    include: {
      tins: { where: { status: "DEPLOYED" }, select: { id: true } },
    },
  });

  if (locations.length === 0) return null;

  const points: LocPoint[] = locations.map((loc) => ({
    locationId: loc.id,
    name: loc.name,
    lat: loc.latitude!,
    lng: loc.longitude!,
    tinCount: loc.tins.length,
  }));

  // Cluster locations into N groups
  const clusters = clusterLocations(points, Math.min(numRoutes, points.length));

  // Order stops within each cluster and calculate stats
  const routes: GeneratedRoute[] = clusters.map((cluster, idx) => {
    const ordered = orderByNearest(cluster);
    let totalMiles = 0;
    for (let i = 1; i < ordered.length; i++) {
      totalMiles += haversine(ordered[i - 1].lat, ordered[i - 1].lng, ordered[i].lat, ordered[i].lng);
    }
    const estimatedMinutes = estimateTime(ordered);
    const tinCount = ordered.reduce((sum, s) => sum + s.tinCount, 0);

    return {
      name: `Route ${idx + 1} — ${ordered[0]?.name?.split(" ").slice(-1)[0] || "Area"} area`,
      stops: ordered,
      totalMiles: Math.round(totalMiles * 10) / 10,
      estimatedMinutes: Math.round(estimatedMinutes),
      tinCount,
    };
  });

  // Sort routes by estimated time descending so user can see balance
  routes.sort((a, b) => b.stops.length - a.stops.length);

  // Rename with proper numbering after sort
  routes.forEach((r, i) => {
    r.name = `Route ${i + 1} (${r.stops.length} stops)`;
  });

  const totalTins = routes.reduce((sum, r) => sum + r.tinCount, 0);
  const avgStops = routes.length > 0 ? Math.round(points.length / routes.length) : 0;
  const avgTime = routes.length > 0 ? Math.round(routes.reduce((s, r) => s + r.estimatedMinutes, 0) / routes.length) : 0;

  return {
    routes,
    totalLocations: points.length,
    totalTins,
    avgStopsPerRoute: avgStops,
    avgTimeMinutes: avgTime,
  };
}

export async function createGeneratedRoutes(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const routesJson = formData.get("routes") as string;
  const routes: GeneratedRoute[] = JSON.parse(routesJson);

  // Delete existing AI-generated routes first? No — let the user manage that.
  // Just create new ones.
  for (const route of routes) {
    await prisma.collectionRoute.create({
      data: {
        name: route.name,
        description: `AI-generated: ${route.stops.length} stops, ~${route.totalMiles} miles, ~${Math.round(route.estimatedMinutes / 60 * 10) / 10}hrs`,
        tinCount: route.tinCount,
        source: "MANUAL", // These become predefined routes once created
        createdById: session.id,
        stops: {
          create: route.stops.map((stop, index) => ({
            locationId: stop.locationId,
            sortOrder: index,
          })),
        },
      },
    });
  }

  await logAudit({
    userId: session.id,
    action: "CREATE",
    entityType: "CollectionRoute",
    entityId: "batch",
    details: {
      source: "AI_GENERATED",
      routeCount: routes.length,
      totalStops: routes.reduce((s, r) => s + r.stops.length, 0),
    },
  });

  revalidatePath("/finance/collection-tins/routes");
  redirect("/finance/collection-tins/routes/my-routes");
}
