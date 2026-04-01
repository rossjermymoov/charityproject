"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const ONBOARDING_STEPS = [
  "APPLICATION_RECEIVED",
  "DBS_SUBMITTED",
  "DBS_CLEARED",
  "INDUCTION",
  "TRAINING_ASSIGNED",
  "TRAINING_COMPLETED",
  "FULLY_ONBOARDED",
];

export async function startOnboarding(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const volunteerId = formData.get("volunteerId") as string;

  await prisma.$transaction(
    ONBOARDING_STEPS.map(stepName =>
      prisma.onboardingStep.create({
        data: {
          volunteerId,
          stepName,
          completedAt: stepName === "APPLICATION_RECEIVED" ? new Date() : null,
          completedById: stepName === "APPLICATION_RECEIVED" ? session.id : null,
        },
      })
    )
  );

  await logAudit({
    userId: session.id,
    action: "CREATE",
    entityType: "OnboardingWorkflow",
    entityId: volunteerId,
  });

  revalidatePath("/volunteers/onboarding");
}

export async function completeOnboardingStep(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const volunteerId = formData.get("volunteerId") as string;
  const stepName = formData.get("stepName") as string;

  await prisma.onboardingStep.update({
    where: { volunteerId_stepName: { volunteerId, stepName } },
    data: {
      completedAt: new Date(),
      completedById: session.id,
    },
  });

  if (stepName === "FULLY_ONBOARDED") {
    await prisma.volunteerProfile.update({
      where: { id: volunteerId },
      data: { status: "ACTIVE" },
    });
  }

  await logAudit({
    userId: session.id,
    action: "UPDATE",
    entityType: "OnboardingStep",
    entityId: volunteerId,
    details: { stepName, action: "COMPLETE" },
  });

  revalidatePath("/volunteers/onboarding");
}
