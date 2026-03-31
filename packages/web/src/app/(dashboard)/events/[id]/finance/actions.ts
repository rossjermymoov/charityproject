"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function path(eventId: string) {
  return `/events/${eventId}/finance`;
}

// ── Income Lines ──────────────────────────────────────────────────

export async function addIncomeLine(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const eventId = formData.get("eventId") as string;

  await prisma.eventIncomeLine.create({
    data: {
      eventId,
      category: formData.get("category") as string,
      label: formData.get("label") as string,
      description: (formData.get("description") as string) || null,
      estimated: parseFloat(formData.get("estimated") as string) || 0,
      actual: parseFloat(formData.get("actual") as string) || 0,
    },
  });

  revalidatePath(path(eventId));
}

export async function updateIncomeLine(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = formData.get("id") as string;
  const eventId = formData.get("eventId") as string;

  await prisma.eventIncomeLine.update({
    where: { id },
    data: {
      actual: parseFloat(formData.get("actual") as string) || 0,
    },
  });

  revalidatePath(path(eventId));
}

export async function removeIncomeLine(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = formData.get("id") as string;
  const eventId = formData.get("eventId") as string;

  await prisma.eventIncomeLine.delete({ where: { id } });
  revalidatePath(path(eventId));
}

// ── Cost Lines ────────────────────────────────────────────────────

export async function addCostLine(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const eventId = formData.get("eventId") as string;

  await prisma.eventCostLine.create({
    data: {
      eventId,
      category: formData.get("category") as string,
      label: formData.get("label") as string,
      description: (formData.get("description") as string) || null,
      estimated: parseFloat(formData.get("estimated") as string) || 0,
      actual: parseFloat(formData.get("actual") as string) || 0,
    },
  });

  revalidatePath(path(eventId));
}

export async function updateCostLine(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = formData.get("id") as string;
  const eventId = formData.get("eventId") as string;

  await prisma.eventCostLine.update({
    where: { id },
    data: {
      actual: parseFloat(formData.get("actual") as string) || 0,
    },
  });

  revalidatePath(path(eventId));
}

export async function removeCostLine(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = formData.get("id") as string;
  const eventId = formData.get("eventId") as string;

  await prisma.eventCostLine.delete({ where: { id } });
  revalidatePath(path(eventId));
}

// ── Targets ───────────────────────────────────────────────────────

export async function saveTargets(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const eventId = formData.get("eventId") as string;

  await prisma.eventFinance.upsert({
    where: { eventId },
    update: {
      incomeTarget: parseFloat(formData.get("incomeTarget") as string) || 0,
      costTarget: parseFloat(formData.get("costTarget") as string) || 0,
      profitTarget: parseFloat(formData.get("profitTarget") as string) || 0,
    },
    create: {
      eventId,
      incomeTarget: parseFloat(formData.get("incomeTarget") as string) || 0,
      costTarget: parseFloat(formData.get("costTarget") as string) || 0,
      profitTarget: parseFloat(formData.get("profitTarget") as string) || 0,
    },
  });

  revalidatePath(path(eventId));
}

// ── Complete Event ────────────────────────────────────────────────

export async function completeEvent(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const eventId = formData.get("eventId") as string;
  const finalTakings = parseFloat(formData.get("finalTakings") as string) || 0;
  const notes = (formData.get("notes") as string) || null;

  await prisma.eventFinance.upsert({
    where: { eventId },
    update: {
      finalTakings,
      completedAt: new Date(),
      notes,
    },
    create: {
      eventId,
      finalTakings,
      completedAt: new Date(),
      notes,
    },
  });

  await prisma.event.update({
    where: { id: eventId },
    data: { status: "COMPLETED" },
  });

  revalidatePath(path(eventId));
}
