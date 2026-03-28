import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { Building2, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmButton } from "@/components/ui/confirm-button";

export default async function DepartmentsPage() {
  const departments = await prisma.department.findMany({
    include: {
      _count: { select: { volunteerDepartments: true, assignments: true, skills: true } },
      skills: true,
    },
    orderBy: { name: "asc" },
  });

  async function createDepartment(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.department.create({
      data: {
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || null,
      },
    });
    revalidatePath("/volunteers/departments");
  }

  async function deleteDepartment(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const departmentId = formData.get("departmentId") as string;

    // Delete all volunteer department associations first
    await prisma.volunteerDepartment.deleteMany({
      where: { departmentId },
    });

    // Delete the department
    await prisma.department.delete({
      where: { id: departmentId },
    });

    revalidatePath("/volunteers/departments");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
        <p className="text-gray-500 mt-1">Manage departments that volunteers can be assigned to</p>
      </div>

      <Card className="p-4">
        <form action={createDepartment} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
            <input name="name" required placeholder="e.g. Kitchen, Reception, Events" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input name="description" placeholder="Optional description" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <Button type="submit"><Plus className="h-4 w-4 mr-2" /> Add</Button>
        </form>
      </Card>

      {departments.length === 0 ? (
        <EmptyState icon={Building2} title="No departments" description="Create departments to organise your volunteers." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Card key={dept.id} className="p-6 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                  {!dept.isActive && <Badge className="bg-gray-100 text-gray-600 text-xs">Inactive</Badge>}
                </div>
                <form action={deleteDepartment} className="inline">
                  <input type="hidden" name="departmentId" value={dept.id} />
                  <ConfirmButton
                    message={`Delete department "${dept.name}"? This will remove it from all volunteers and related records.`}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-500 transition p-0 h-auto"
                    title="Delete department"
                  >
                    <X className="h-4 w-4" />
                  </ConfirmButton>
                </form>
              </div>
              {dept.description && <p className="text-sm text-gray-500 mb-3">{dept.description}</p>}
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>{dept._count.volunteerDepartments} volunteers</span>
                <span>{dept._count.assignments} assignments</span>
                <span>{dept._count.skills} skills</span>
              </div>
              {dept.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {dept.skills.map((s) => (
                    <Badge key={s.id} variant="outline" className="text-xs">{s.name}</Badge>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
