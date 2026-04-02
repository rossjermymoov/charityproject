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
