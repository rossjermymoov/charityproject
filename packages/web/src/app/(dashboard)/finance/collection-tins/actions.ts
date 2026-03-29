"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function quickSetStatus(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const tinId = formData.get("tinId") as string;
  const newStatus = formData.get("status") as string;

  const tin = await prisma.collectionTin.findUnique({ where: { id: tinId } });
  if (!tin) return;

  const update: Record<string, unknown> = { status: newStatus };

  if (newStatus === "DEPLOYED" && !tin.deployedAt) {
    update.deployedAt = new Date();
  } else if (newStatus === "RETURNED" && !tin.returnedAt) {
    update.returnedAt = new Date();
  }

  await prisma.collectionTin.update({
    where: { id: tinId },
    data: update,
  });

  // Always create a movement record for status changes
  await prisma.collectionTinMovement.create({
    data: {
      tinId,
      type: newStatus,
      date: new Date(),
      notes: `Status changed to ${newStatus}`,
    },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "CollectionTin",
    entityId: tinId,
    details: { status: newStatus },
  });

  revalidatePath("/finance/collection-tins");
}

export async function swapTin(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const currentTinId = formData.get("currentTinId") as string;
  const existingTinId = (formData.get("replacementTinId") as string) || null;
  const newTinNumber = (formData.get("newTinNumber") as string)?.trim() || null;
  const amount = parseFloat(formData.get("amount") as string) || 0;
  const notes = (formData.get("notes") as string) || null;

  const currentTin = await prisma.collectionTin.findUnique({
    where: { id: currentTinId },
  });
  if (!currentTin) return;

  // Resolve the replacement tin: pick existing or create new
  let replacement: { id: string; tinNumber: string } | null = null;

  if (existingTinId) {
    const found = await prisma.collectionTin.findUnique({
      where: { id: existingTinId },
    });
    if (found) replacement = found;
  } else if (newTinNumber) {
    const existing = await prisma.collectionTin.findUnique({
      where: { tinNumber: newTinNumber },
    });
    if (existing) {
      if (existing.status === "IN_STOCK") {
        replacement = existing;
      } else {
        return; // Can't use a tin that's not in stock
      }
    } else {
      replacement = await prisma.collectionTin.create({
        data: {
          tinNumber: newTinNumber,
          locationName: currentTin.locationName,
          locationAddress: currentTin.locationAddress,
          locationId: currentTin.locationId,
          status: "IN_STOCK",
          createdById: session.id,
        },
      });
    }
  }

  if (!replacement) return;

  const now = new Date();

  // 1. Record collection amount on the current tin
  if (amount > 0) {
    await prisma.collectionTinMovement.create({
      data: {
        tinId: currentTinId,
        type: "COUNTED",
        date: now,
        amount,
        notes: notes || "Counted during swap",
      },
    });
  }

  // 2. Return current tin to IN_STOCK
  await prisma.collectionTin.update({
    where: { id: currentTinId },
    data: {
      status: "IN_STOCK",
      returnedAt: now,
    },
  });
  await prisma.collectionTinMovement.create({
    data: {
      tinId: currentTinId,
      type: "RETURNED",
      date: now,
      notes: `Swapped out — replaced by ${replacement.tinNumber}`,
    },
  });

  // 3. Deploy replacement tin to the same location
  await prisma.collectionTin.update({
    where: { id: replacement.id },
    data: {
      status: "DEPLOYED",
      deployedAt: now,
      locationId: currentTin.locationId,
      locationName: currentTin.locationName,
      locationAddress: currentTin.locationAddress,
    },
  });
  await prisma.collectionTinMovement.create({
    data: {
      tinId: replacement.id,
      type: "DEPLOYED",
      date: now,
      notes: `Swapped in — replacing ${currentTin.tinNumber}`,
    },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "CollectionTin",
    entityId: currentTinId,
    details: { action: "SWAP", replacementId: replacement.id, amount },
  });

  revalidatePath("/finance/collection-tins");
  redirect(`/finance/collection-tins/${replacement.id}`);
}
