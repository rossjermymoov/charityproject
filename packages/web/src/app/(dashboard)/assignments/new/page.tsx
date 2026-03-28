import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";

export default async function NewAssignmentPage() {
  const [volunteers, departments] = await Promise.all([
    prisma.volunteerProfile.findMany({
      where: { status: { not: "DEPARTED" } },
      include: { contact: true },
      orderBy: { contact: { firstName: "asc" } },
    }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  async function createAssignment(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    await prisma.assignment.create({
      data: {
        volunteerId: formData.get("volunteerId") as string,
        departmentId: formData.get("departmentId") as string,
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || null,
        date: formData.get("date") as string,
        startTime: formData.get("startTime") as string,
        endTime: formData.get("endTime") as string,
        createdById: session.id,
      },
    });

    redirect("/assignments");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/assignments" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Assignment</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createAssignment} className="space-y-6">
            <Input label="Title" name="title" required placeholder="e.g. Morning kitchen shift" />
            <Textarea label="Description" name="description" placeholder="Optional details..." />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volunteer</label>
              <SearchableSelect
                name="volunteerId"
                required
                placeholder="Search volunteers..."
                options={volunteers.map((v) => ({
                  value: v.id,
                  label: `${v.contact.firstName} ${v.contact.lastName}`,
                }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <SearchableSelect
                name="departmentId"
                required
                placeholder="Search departments..."
                options={departments.map((d) => ({
                  value: d.id,
                  label: d.name,
                }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input label="Date" name="date" type="date" required />
              <Input label="Start Time" name="startTime" type="time" required />
              <Input label="End Time" name="endTime" type="time" required />
            </div>

            <div className="flex justify-end gap-3">
              <Link href="/assignments">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit">Create Assignment</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
