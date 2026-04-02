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

/**
 * Balanced clustering: ensures each cluster has roughly the same number of locations.
 *
 * Algorithm:
 * 1. Run standard k-means to get centroids (for geographic grouping)
 * 2. Then use a balanced assignment: iteratively assign each location to its
 *    nearest centroid that still has capacity (capacity = ceil(N/k))
 * 3. Re-run centroid updates and balanced assignment for several iterations
 */
function balancedCluster(locations: LocPoint[], k: number): LocPoint[][] {
  if (locations.length <= k) {
    return locations.map((l) => [l]);
  }

  const n = locations.length;
  const maxPerCluster = Math.ceil(n / k);

  // Initialise centroids using farthest-first
  const centroids: { lat: number; lng: number }[] = [];
  const sorted = [...locations].sort((a, b) => b.lat - a.lat);
  centroids.push({ lat: sorted[0].lat, lng: sorted[0].lng });

  for (let i = 1; i < k; i++) {
    let bestIdx = 0;
    let bestDist = -1;
    for (let j = 0; j < n; j++) {
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

  let assignments = new Array(n).fill(0);

  // Iterate balanced k-means (15 iterations)
  for (let iter = 0; iter < 15; iter++) {
    // --- Balanced assignment step ---
    // For each location, compute distance to every centroid
    // Sort all (location, centroid) pairs by distance
    // Greedily assign: pick shortest distance pair where both location is
    // unassigned AND centroid has capacity remaining
    const pairs: { locIdx: number; centIdx: number; dist: number }[] = [];
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < k; c++) {
        pairs.push({
          locIdx: i,
          centIdx: c,
          dist: haversine(locations[i].lat, locations[i].lng, centroids[c].lat, centroids[c].lng),
        });
      }
    }
    pairs.sort((a, b) => a.dist - b.dist);

    const newAssignments = new Array(n).fill(-1);
    const clusterSizes = new Array(k).fill(0);
    const assigned = new Set<number>();

    for (const pair of pairs) {
      if (assigned.has(pair.locIdx)) continue;
      if (clusterSizes[pair.centIdx] >= maxPerCluster) continue;

      newAssignments[pair.locIdx] = pair.centIdx;
      clusterSizes[pair.centIdx]++;
      assigned.add(pair.locIdx);

      if (assigned.size === n) break;
    }

    // Handle any stragglers (shouldn't happen, but safety net)
    for (let i = 0; i < n; i++) {
      if (newAssignments[i] === -1) {
        // Find centroid with smallest size
        let minC = 0;
        for (let c = 1; c < k; c++) {
          if (clusterSizes[c] < clusterSizes[minC]) minC = c;
        }
        newAssignments[i] = minC;
        clusterSizes[minC]++;
      }
    }

    // Check convergence
    if (JSON.stringify(newAssignments) === JSON.stringify(assignments)) break;
    assignments = newAssignments;

    // --- Centroid update step ---
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

  // Remove empty clusters (shouldn't happen with balanced algo but just in case)
  return clusters.filter((c) => c.length > 0);
}

// Order stops within a cluster using nearest-neighbour from a start point
function orderByNearest(locations: LocPoint[], startLat?: number, startLng?: number): LocPoint[] {
  if (locations.length <= 1) return locations;

  const ordered: LocPoint[] = [];
  const remaining = [...locations];

  if (startLat != null && startLng != null) {
    // Start from the location nearest to the head office
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversine(startLat, startLng, remaining[i].lat, remaining[i].lng);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    ordered.push(remaining.splice(nearestIdx, 1)[0]);
  } else {
    // Fallback: start from northernmost point
    remaining.sort((a, b) => b.lat - a.lat);
    ordered.push(remaining.shift()!);
  }

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
  headOfficeAddress: string | null;
};

export async function previewGenerateRoutes(formData: FormData): Promise<GeneratePreview | null> {
  const session = await getSession();
  if (!session) return null;

  const numRoutes = parseInt(formData.get("numRoutes") as string) || 5;

  // Fetch head office location from settings
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    select: { headOfficeAddress: true, headOfficeLat: true, headOfficeLng: true },
  });

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

  // Cluster locations into N balanced groups
  const clusters = balancedCluster(points, Math.min(numRoutes, points.length));

  const startLat = settings?.headOfficeLat ?? undefined;
  const startLng = settings?.headOfficeLng ?? undefined;

  // Order stops within each cluster and calculate stats
  const routes: GeneratedRoute[] = clusters.map((cluster, idx) => {
    const ordered = orderByNearest(cluster, startLat, startLng);
    let totalMiles = 0;
    for (let i = 1; i < ordered.length; i++) {
      totalMiles += haversine(ordered[i - 1].lat, ordered[i - 1].lng, ordered[i].lat, ordered[i].lng);
    }
    const estimatedMinutes = estimateTime(ordered);
    const tinCount = ordered.reduce((sum, s) => sum + s.tinCount, 0);

    return {
      name: `Route ${idx + 1}`,
      stops: ordered,
      totalMiles: Math.round(totalMiles * 10) / 10,
      estimatedMinutes: Math.round(estimatedMinutes),
      tinCount,
    };
  });

  // Sort routes by number of stops descending
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
    headOfficeAddress: settings?.headOfficeAddress || null,
  };
}

export async function createGeneratedRoutes(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const routesJson = formData.get("routes") as string;
  const routes: GeneratedRoute[] = JSON.parse(routesJson);

  // Deactivate all existing active routes — the generator covers ALL deployed
  // tins, so old routes would overlap. A location can only be on one route.
  const existingRoutes = await prisma.collectionRoute.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  if (existingRoutes.length > 0) {
    // Delete route stops for existing routes, then deactivate the routes
    await prisma.routeStop.deleteMany({
      where: { routeId: { in: existingRoutes.map((r) => r.id) } },
    });
    await prisma.collectionRoute.updateMany({
      where: { id: { in: existingRoutes.map((r) => r.id) } },
      data: { isActive: false },
    });
  }

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
