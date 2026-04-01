"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createTemplate(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  await prisma.financialTemplate.create({
    data: { name, description },
  });

  revalidatePath("/settings/events/templates");
}

export async function deleteTemplate(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const templateId = formData.get("templateId") as string;

  await prisma.financialTemplate.delete({ where: { id: templateId } });

  await logAudit({
    userId: session.id,
    action: "DELETE",
    entityType: "FinancialTemplate",
    entityId: templateId,
  });

  revalidatePath("/settings/events/templates");
}

export async function saveEventAsTemplate(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const eventId = formData.get("eventId") as string;
  const name = formData.get("templateName") as string;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { incomeLines: true, costLines: true },
  });

  if (!event) return;

  const incomeLines = event.incomeLines.map(l => ({
    category: l.category,
    label: l.label,
    estimated: l.estimated,
  }));

  const costLines = event.costLines.map(l => ({
    category: l.category,
    label: l.label,
    estimated: l.estimated,
  }));

  await prisma.financialTemplate.create({
    data: {
      name,
      description: `Template from event: ${event.name}`,
      incomeLines: JSON.stringify(incomeLines),
      costLines: JSON.stringify(costLines),
    },
  });

  await logAudit({
    userId: session.id,
    action: "CREATE",
    entityType: "FinancialTemplate",
    entityId: eventId,
    details: { action: "SAVE_AS_TEMPLATE", name },
  });

  revalidatePath("/settings/events/templates");
  revalidatePath(`/events/${eventId}`);
}
