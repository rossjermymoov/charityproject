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
