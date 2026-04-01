"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function addDeptTraining(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const departmentId = formData.get("departmentId") as string;
  const courseId = formData.get("courseId") as string;

  await prisma.departmentTraining.create({
    data: { departmentId, courseId },
  });

  // Auto-assign to all current volunteers in this department
  const volunteersInDept = await prisma.volunteerDepartment.findMany({
    where: { departmentId },
    include: { volunteer: true },
  });

  for (const vd of volunteersInDept) {
    // Check if already has this training
    const existing = await prisma.volunteerTraining.findUnique({
      where: { volunteerId_courseId: { volunteerId: vd.volunteerId, courseId } },
    });
    if (!existing) {
      await prisma.volunteerTraining.create({
        data: {
          volunteerId: vd.volunteerId,
          courseId,
          status: "NOT_STARTED",
        },
      });
    }
  }

  await logAudit({
    userId: session.id,
    action: "CREATE",
    entityType: "DepartmentTraining",
    entityId: departmentId,
    details: { courseId, autoAssigned: volunteersInDept.length },
  });

  revalidatePath("/volunteers/training/dept-training");
}

export async function removeDeptTraining(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const deptTrainingId = formData.get("deptTrainingId") as string;
  const departmentId = formData.get("departmentId") as string;

  await prisma.departmentTraining.delete({ where: { id: deptTrainingId } });

  await logAudit({
    userId: session.id,
    action: "DELETE",
    entityType: "DepartmentTraining",
    entityId: departmentId,
    details: { deptTrainingId },
  });

  revalidatePath("/volunteers/training/dept-training");
}
