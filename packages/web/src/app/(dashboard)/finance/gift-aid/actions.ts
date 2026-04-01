"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function ceaseGiftAid(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const giftAidId = formData.get("giftAidId") as string;
  const cessationReason = formData.get("cessationReason") as string;
  const cessationDate = formData.get("cessationDate") as string;
  const cessationNotes = (formData.get("cessationNotes") as string) || null;

  await prisma.giftAid.update({
    where: { id: giftAidId },
    data: {
      status: "CANCELLED",
      cessationReason,
      cessationDate: new Date(cessationDate),
      cessationNotes,
      endDate: new Date(cessationDate),
    },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "GiftAid",
    entityId: giftAidId,
    details: { action: "CESSATION", reason: cessationReason },
  });

  revalidatePath(`/finance/gift-aid/${giftAidId}`);
}

export async function pauseGiftAid(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const giftAidId = formData.get("giftAidId") as string;
  const pauseFrom = formData.get("pauseFrom") as string;
  const pauseUntil = (formData.get("pauseUntil") as string) || null;
  const reason = (formData.get("reason") as string) || null;

  await prisma.giftAidPause.create({
    data: {
      giftAidId,
      pauseFrom: new Date(pauseFrom),
      pauseUntil: pauseUntil ? new Date(pauseUntil) : null,
      reason,
    },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "GiftAid",
    entityId: giftAidId,
    details: { action: "PAUSE", pauseFrom },
  });

  revalidatePath(`/finance/gift-aid/${giftAidId}`);
}

export async function resumeGiftAid(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const pauseId = formData.get("pauseId") as string;
  const giftAidId = formData.get("giftAidId") as string;

  await prisma.giftAidPause.update({
    where: { id: pauseId },
    data: {
      resumedAt: new Date(),
      resumedById: session.id,
    },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "GiftAid",
    entityId: giftAidId,
    details: { action: "RESUME", pauseId },
  });

  revalidatePath(`/finance/gift-aid/${giftAidId}`);
}

export async function updateBackdating(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const giftAidId = formData.get("giftAidId") as string;
  const backdateFrom = (formData.get("backdateFrom") as string) || null;

  await prisma.giftAid.update({
    where: { id: giftAidId },
    data: {
      backdateFrom: backdateFrom ? new Date(backdateFrom) : null,
    },
  });

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "GiftAid",
    entityId: giftAidId,
    details: { action: "BACKDATE", backdateFrom },
  });

  revalidatePath(`/finance/gift-aid/${giftAidId}`);
}
