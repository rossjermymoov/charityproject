"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function addDrivingLicence(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const volunteerId = formData.get("volunteerId") as string;
  const licenceNumber = (formData.get("licenceNumber") as string) || null;
  const expiryDate = (formData.get("expiryDate") as string) || null;

  await prisma.drivingLicence.create({
    data: {
      volunteerId,
      licenceNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    },
  });

  await logAudit({
    userId: session.id,
    action: "CREATE",
    entityType: "DrivingLicence",
    entityId: volunteerId,
  });

  revalidatePath("/volunteers/licences");
}

export async function verifyLicence(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const licenceId = formData.get("licenceId") as string;

  await prisma.drivingLicence.update({
    where: { id: licenceId },
    data: {
      verifiedAt: new Date(),
      verifiedById: session.id,
    },
  });

  revalidatePath("/volunteers/licences");
}
