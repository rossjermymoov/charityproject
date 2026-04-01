import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { addDeptTraining, removeDeptTraining } from "./actions";

export default async function DeptTrainingPage() {
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    include: {
      requiredTraining: {
        include: { course: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const courses = await prisma.trainingCourse.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/volunteers/training" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Training Requirements</h1>
          <p className="text-gray-500 mt-1">Assign required training courses to departments. Volunteers assigned to a department will automatically receive these courses.</p>
        </div>
      </div>

      {departments.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-gray-500">No active departments found.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {departments.map(dept => (
            <Card key={dept.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{dept.name}</h2>
                <Badge className="bg-indigo-100 text-indigo-800">
                  {dept.requiredTraining.length} required courses
                </Badge>
              </div>

              {dept.requiredTraining.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {dept.requiredTraining.map(dt => (
                    <div key={dt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div>
                          <p className="font-medium text-gray-900">{dt.course.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {dt.course.isMandatory && (
                              <Badge className="bg-red-100 text-red-800 text-xs">Mandatory</Badge>
                            )}
                            {dt.course.validityMonths && (
                              <span className="text-xs text-gray-500">Renew every {dt.course.validityMonths} months</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <form action={removeDeptTraining} className="flex-shrink-0">
                        <input type="hidden" name="deptTrainingId" value={dt.id} />
                        <input type="hidden" name="departmentId" value={dept.id} />
                        <button type="submit" className="text-gray-400 hover:text-red-600 p-2 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">No required courses assigned.</p>
              )}

              <form action={addDeptTraining} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Add Required Course</h3>
                <input type="hidden" name="departmentId" value={dept.id} />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <select
                      name="courseId"
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select course...</option>
                      {courses
                        .filter(c => !dept.requiredTraining.find(dt => dt.courseId === c.id))
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>
                  <Button type="submit" size="sm" className="flex-shrink-0 gap-1">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </form>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
