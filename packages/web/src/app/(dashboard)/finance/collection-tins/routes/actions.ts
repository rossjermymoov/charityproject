"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Create a route template (not an instance of running it)
export async function createRoute(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const tinCount = parseInt(formData.get("tinCount") as string) || 0;
  const assignedToId = (formData.get("assignedToId") as string) || null;

  const route = await prisma.collectionRoute.create({
    data: {
      name,
      description,
      tinCount,
      assignedToId: assignedToId || null,
      createdById: session.id,
    },
  });

  await logAudit({
    userId: session.id,
    action: "CREATE",
    entityType: "CollectionRoute",
    entityId: route.id,
    details: { name, tinCount },
  });

  redirect(`/finance/collection-tins/routes/${route.id}`);
}

// Update route template fields
export async function updateRoute(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const routeId = formData.get("routeId") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const tinCount = parseInt(formData.get("tinCount") as string) || 0;
  const assignedToId = (formData.get("assignedToId") as string) || null;

  await prisma.collectionRoute.update({
    where: { id: routeId },
    data: {
      name,
      description,
      tinCount,
      assignedToId: assignedToId || null,
    },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "CollectionRoute",
    entityId: routeId,
    details: { name, tinCount },
  });

  revalidatePath(`/finance/collection-tins/routes/${routeId}`);
  revalidatePath("/finance/collection-tins/routes");
}

// Add a RouteStop to the template
export async function addStop(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const routeId = formData.get("routeId") as string;
  const locationId = formData.get("locationId") as string;
  const parkingNotes = (formData.get("parkingNotes") as string) || null;
  const accessNotes = (formData.get("accessNotes") as string) || null;

  const maxStop = await prisma.routeStop.findFirst({
    where: { routeId },
    orderBy: { sortOrder: "desc" },
  });
  const nextOrder = (maxStop?.sortOrder ?? -1) + 1;

  await prisma.routeStop.create({
    data: {
      routeId,
      locationId,
      sortOrder: nextOrder,
      parkingNotes,
      accessNotes,
    },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "CollectionRoute",
    entityId: routeId,
    details: { action: "ADD_STOP", locationId },
  });

  revalidatePath(`/finance/collection-tins/routes/${routeId}`);
}

// Remove a RouteStop from the template
export async function removeStop(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const stopId = formData.get("stopId") as string;
  const routeId = formData.get("routeId") as string;

  await prisma.routeStop.delete({ where: { id: stopId } });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "CollectionRoute",
    entityId: routeId,
    details: { action: "REMOVE_STOP", stopId },
  });

  revalidatePath(`/finance/collection-tins/routes/${routeId}`);
}

// Reorder RouteStops in the template
export async function reorderStops(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const routeId = formData.get("routeId") as string;
  const orderedIds = JSON.parse(formData.get("orderedIds") as string) as string[];

  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.routeStop.update({ where: { id }, data: { sortOrder: index } })
    )
  );

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "CollectionRoute",
    entityId: routeId,
    details: { action: "REORDER_STOPS" },
  });

  revalidatePath(`/finance/collection-tins/routes/${routeId}`);
}

// Delete route template and all its runs/stops
export async function deleteRoute(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const routeId = formData.get("routeId") as string;

  await prisma.collectionRoute.delete({ where: { id: routeId } });

  await logAudit({
    userId: session.id,
    action: "DELETE",
    entityType: "CollectionRoute",
    entityId: routeId,
  });

  redirect("/finance/collection-tins/routes");
}

// Create a new CollectionRun (instance of running a route on a date)
export async function scheduleRun(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const routeId = formData.get("routeId") as string;
  const scheduledDate = formData.get("scheduledDate") as string;
  const assignedToId = (formData.get("assignedToId") as string) || null;

  // Get route with its stops
  const route = await prisma.collectionRoute.findUnique({
    where: { id: routeId },
    include: { stops: { orderBy: { sortOrder: "asc" } } },
  });

  if (!route) return;

  // Create the run
  const run = await prisma.collectionRun.create({
    data: {
      routeId,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      assignedToId: assignedToId || null,
      createdById: session.id,
    },
  });

  // Create RunStop for each RouteStop
  await Promise.all(
    route.stops.map((routeStop) =>
      prisma.runStop.create({
        data: {
          runId: run.id,
          routeStopId: routeStop.id,
        },
      })
    )
  );

  await logAudit({
    userId: session.id,
    action: "CREATE",
    entityType: "CollectionRun",
    entityId: run.id,
    details: { routeId, scheduledDate },
  });

  revalidatePath("/finance/collection-tins/routes");
  redirect(`/finance/collection-tins/routes/run/${run.id}`);
}

// Start a run (set status to IN_PROGRESS, set startedAt)
export async function startRun(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const runId = formData.get("runId") as string;

  await prisma.collectionRun.update({
    where: { id: runId },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "CollectionRun",
    entityId: runId,
    details: { action: "START_RUN" },
  });

  revalidatePath(`/finance/collection-tins/routes/run/${runId}`);
}

// Complete a run (set status to COMPLETED, set completedAt)
export async function completeRun(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const runId = formData.get("runId") as string;

  await prisma.collectionRun.update({
    where: { id: runId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "CollectionRun",
    entityId: runId,
    details: { action: "COMPLETE_RUN" },
  });

  revalidatePath(`/finance/collection-tins/routes/run/${runId}`);
}

// Cancel a run
export async function cancelRun(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const runId = formData.get("runId") as string;

  await prisma.collectionRun.update({
    where: { id: runId },
    data: { status: "CANCELLED" },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "CollectionRun",
    entityId: runId,
    details: { action: "CANCEL_RUN" },
  });

  revalidatePath(`/finance/collection-tins/routes/run/${runId}`);
}

// Complete a RunStop (mark as COMPLETED with deployed/collected tins and GPS)
export async function completeRunStop(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const runStopId = formData.get("runStopId") as string;
  const deployedTinId = (formData.get("deployedTinId") as string) || null;
  const collectedTinId = (formData.get("collectedTinId") as string) || null;
  const latitude = formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null;
  const longitude = formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null;

  const runStop = await prisma.runStop.findUnique({
    where: { id: runStopId },
    include: {
      run: { include: { route: true } },
      routeStop: { include: { location: true } },
    },
  });

  if (!runStop) return;

  const now = new Date();

  // Update RunStop status
  await prisma.runStop.update({
    where: { id: runStopId },
    data: {
      status: "COMPLETED",
      deployedTinId,
      collectedTinId,
      completedAt: now,
      latitude,
      longitude,
    },
  });

  // Deploy new tin
  if (deployedTinId) {
    await prisma.collectionTin.update({
      where: { id: deployedTinId },
      data: {
        status: "DEPLOYED",
        deployedAt: now,
        locationId: runStop.routeStop.locationId,
        locationName: runStop.routeStop.location.name,
        locationAddress: runStop.routeStop.location.address,
      },
    });
    await prisma.collectionTinMovement.create({
      data: {
        tinId: deployedTinId,
        type: "DEPLOYED",
        date: now,
        notes: `Deployed on route: ${runStop.run.route.name}`,
        routeId: runStop.run.routeId,
      },
    });
  }

  // Collect old tin
  if (collectedTinId) {
    await prisma.collectionTin.update({
      where: { id: collectedTinId },
      data: { status: "RETURNED" },
    });
    await prisma.collectionTinMovement.create({
      data: {
        tinId: collectedTinId,
        type: "COLLECTED",
        date: now,
        notes: `Collected on route: ${runStop.run.route.name}`,
        routeId: runStop.run.routeId,
      },
    });
  }

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "RunStop",
    entityId: runStopId,
    details: { action: "COMPLETE_STOP", deployedTinId, collectedTinId },
  });

  revalidatePath(`/finance/collection-tins/routes/run/${runStop.run.id}`);
}

// Skip a RunStop
export async function skipRunStop(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const runStopId = formData.get("runStopId") as string;
  const skipReason = (formData.get("skipReason") as string) || "Not accessible";

  const runStop = await prisma.runStop.findUnique({
    where: { id: runStopId },
    include: { run: true },
  });

  if (!runStop) return;

  await prisma.runStop.update({
    where: { id: runStopId },
    data: { status: "SKIPPED", skipReason, completedAt: new Date() },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "RunStop",
    entityId: runStopId,
    details: { action: "SKIP_STOP", skipReason },
  });

  revalidatePath(`/finance/collection-tins/routes/run/${runStop.run.id}`);
}

// Process return (count a tin, link to run)
export async function processReturn(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const tinNumber = (formData.get("tinNumber") as string)?.trim();
  const amount = parseFloat(formData.get("amount") as string) || 0;
  const notes = (formData.get("notes") as string) || null;
  const runId = (formData.get("runId") as string) || null;

  if (!tinNumber) return;

  const tin = await prisma.collectionTin.findUnique({
    where: { tinNumber },
  });

  if (!tin) return;

  const now = new Date();

  // Create TinReturn linked to runId
  await prisma.tinReturn.create({
    data: {
      tinId: tin.id,
      runId: runId || null,
      amount,
      countedById: session.id,
      returnedAt: now,
      notes,
    },
  });

  // Update tin status
  await prisma.collectionTin.update({
    where: { id: tin.id },
    data: { status: "IN_STOCK", returnedAt: now },
  });

  // Create movement record
  await prisma.collectionTinMovement.create({
    data: {
      tinId: tin.id,
      type: "COUNTED",
      date: now,
      amount,
      notes: notes || `Counted and returned to stock (£${amount.toFixed(2)})`,
    },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "CollectionTin",
    entityId: tin.id,
    details: { action: "RETURN_PROCESS", amount, tinNumber },
  });

  revalidatePath("/finance/collection-tins/routes/count");
  if (runId) {
    revalidatePath(`/finance/collection-tins/routes/count/${runId}`);
  }
}
