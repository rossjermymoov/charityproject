import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Wrench, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default async function SkillsPage() {
  const [skills, departments] = await Promise.all([
    prisma.skill.findMany({
      include: {
        department: true,
        _count: { select: { volunteerSkills: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  async function createSkill(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.skill.create({
      data: {
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || null,
        departmentId: (formData.get("departmentId") as string) || null,
      },
    });
    redirect("/volunteers/skills");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Skills</h1>
        <p className="text-gray-500 mt-1">Manage skills that can be assigned to volunteers</p>
      </div>

      <Card className="p-4">
        <form action={createSkill} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name</label>
            <input name="name" required placeholder="e.g. Kitchen, First Aid, Driving" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input name="description" placeholder="Optional" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select name="departmentId" className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">None</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <Button type="submit"><Plus className="h-4 w-4 mr-2" /> Add</Button>
        </form>
      </Card>

      {skills.length === 0 ? (
        <EmptyState icon={Wrench} title="No skills" description="Create skills to tag volunteers with." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <Card key={skill.id} className="p-6">
              <h3 className="font-semibold text-gray-900">{skill.name}</h3>
              {skill.description && <p className="text-sm text-gray-500 mt-1">{skill.description}</p>}
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                <span>{skill._count.volunteerSkills} volunteers</span>
                {skill.department && <Badge variant="outline" className="text-xs">{skill.department.name}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
