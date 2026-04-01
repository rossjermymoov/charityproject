"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createRoute(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const tinCount = parseInt(formData.get("tinCount") as string) || 0;
  const scheduledDate = formData.get("scheduledDate") as string;
  const assignedToId = (formData.get("assignedToId") as string) || null;

  const route = await prisma.collectionRoute.create({
    data: {
      name,
      description,
      tinCount,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
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

export async function updateRoute(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const routeId = formData.get("routeId") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const tinCount = parseInt(formData.get("tinCount") as string) || 0;
  const scheduledDate = formData.get("scheduledDate") as string;
  const assignedToId = (formData.get("assignedToId") as string) || null;
  const status = (formData.get("status") as string) || undefined;

  await prisma.collectionRoute.update({
    where: { id: routeId },
    data: {
      name,
      description,
      tinCount,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      assignedToId: assignedToId || null,
      ...(status ? { status } : {}),
    },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "CollectionRoute",
    entityId: routeId,
    details: { name, status },
  });

  revalidatePath(`/finance/collection-tins/routes/${routeId}`);
  revalidatePath("/finance/collection-tins/routes");
}

export async function addStop(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const routeId = formData.get("routeId") as string;
  const locationId = formData.get("locationId") as string;
  const parkingNotes = (formData.get("parkingNotes") as string) || null;
  const accessNotes = (formData.get("accessNotes") as string) || null;

  // Get current max sort order
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

export async function removeStop(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const stopId = formData.get("stopId") as string;
  const routeId = formData.get("routeId") as string;

  await prisma.routeStop.delete({ where: { id: stopId } });

  revalidatePath(`/finance/collection-tins/routes/${routeId}`);
}

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

  revalidatePath(`/finance/collection-tins/routes/${routeId}`);
}

export async function startRoute(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const routeId = formData.get("routeId") as string;

  await prisma.collectionRoute.update({
    where: { id: routeId },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "CollectionRoute",
    entityId: routeId,
    details: { action: "START_ROUTE" },
  });

  revalidatePath(`/finance/collection-tins/routes/${routeId}`);
}

export async function completeRoute(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const routeId = formData.get("routeId") as string;

  await prisma.collectionRoute.update({
    where: { id: routeId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "CollectionRoute",
    entityId: routeId,
    details: { action: "COMPLETE_ROUTE" },
  });

  revalidatePath(`/finance/collection-tins/routes/${routeId}`);
  revalidatePath("/finance/collection-tins/routes");
}

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

export async function processReturn(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const tinNumber = (formData.get("tinNumber") as string)?.trim();
  const amount = parseFloat(formData.get("amount") as string) || 0;
  const notes = (formData.get("notes") as string) || null;

  if (!tinNumber) return;

  const tin = await prisma.collectionTin.findUnique({
    where: { tinNumber },
    include: {
      location: true,
      movements: { orderBy: { date: "desc" }, take: 1 }
    },
  });

  if (!tin) return;

  // Find which route this tin was on (if any)
  const routeStop = await prisma.routeStop.findFirst({
    where: { collectedTinId: tin.id },
    include: { route: true },
    orderBy: { completedAt: "desc" },
  });

  const now = new Date();

  // Create TinReturn record
  await prisma.tinReturn.create({
    data: {
      tinId: tin.id,
      routeId: routeStop?.routeId || null,
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
      routeId: routeStop?.routeId || null,
      stopId: routeStop?.id || null,
    },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "CollectionTin",
    entityId: tin.id,
    details: { action: "RETURN_PROCESS", amount, tinNumber },
  });

  revalidatePath("/finance/collection-tins/routes/returns");
  revalidatePath("/finance/collection-tins");
}

export async function completeStop(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const stopId = formData.get("stopId") as string;
  const deployedTinId = (formData.get("deployedTinId") as string) || null;
  const collectedTinId = (formData.get("collectedTinId") as string) || null;
  const latitude = formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null;
  const longitude = formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null;

  const stop = await prisma.routeStop.findUnique({
    where: { id: stopId },
    include: { route: true, location: true },
  });
  if (!stop) return;

  const now = new Date();

  await prisma.routeStop.update({
    where: { id: stopId },
    data: {
      status: "COMPLETED",
      deployedTinId,
      collectedTinId,
      completedAt: now,
      latitude,
      longitude,
    },
  });

  // Deploy the new tin
  if (deployedTinId) {
    await prisma.collectionTin.update({
      where: { id: deployedTinId },
      data: {
        status: "DEPLOYED",
        deployedAt: now,
        locationId: stop.locationId,
        locationName: stop.location.name,
        locationAddress: stop.location.address,
      },
    });
    await prisma.collectionTinMovement.create({
      data: {
        tinId: deployedTinId,
        type: "DEPLOYED",
        date: now,
        notes: `Deployed on route: ${stop.route.name}`,
        routeId: stop.routeId,
        stopId: stop.id,
      },
    });
  }

  // Collect the old tin
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
        notes: `Collected on route: ${stop.route.name}`,
        routeId: stop.routeId,
        stopId: stop.id,
      },
    });
  }

  revalidatePath(`/finance/collection-tins/routes/${stop.routeId}`);
}

export async function skipStop(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const stopId = formData.get("stopId") as string;
  const skipReason = (formData.get("skipReason") as string) || "Not accessible";

  const stop = await prisma.routeStop.findUnique({ where: { id: stopId } });
  if (!stop) return;

  await prisma.routeStop.update({
    where: { id: stopId },
    data: { status: "SKIPPED", skipReason, completedAt: new Date() },
  });

  revalidatePath(`/finance/collection-tins/routes/${stop.routeId}`);
}
