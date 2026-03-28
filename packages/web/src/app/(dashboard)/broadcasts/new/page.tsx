import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewBroadcastPage() {
  const [departments, skills] = await Promise.all([
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.skill.findMany({ orderBy: { name: "asc" } }),
  ]);

  async function createBroadcast(formData: FormData) {
    "use server";
    const session = await getSession();
    if (!session) redirect("/login");

    const skillIds = formData.getAll("skills") as string[];
    const expiresInHours = parseInt(formData.get("expiresInHours") as string) || 4;

    const broadcast = await prisma.broadcast.create({
      data: {
        title: formData.get("title") as string,
        message: formData.get("message") as string,
        urgency: formData.get("urgency") as string,
        departmentId: (formData.get("departmentId") as string) || null,
        targetDate: formData.get("targetDate") as string,
        targetStartTime: formData.get("targetStartTime") as string,
        targetEndTime: formData.get("targetEndTime") as string,
        maxRespondents: parseInt(formData.get("maxRespondents") as string) || 1,
        createdById: session.id,
        expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
        skills: {
          create: skillIds.map((id) => ({ skillId: id })),
        },
      },
    });

    redirect(`/broadcasts/${broadcast.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/broadcasts" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Broadcast</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createBroadcast} className="space-y-6">
            <Input label="Title" name="title" required placeholder="e.g. Urgent: Kitchen cover needed" />
            <Textarea label="Message" name="message" required placeholder="Describe what's needed and why..." />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Urgency</label>
                <select name="urgency" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select name="departmentId" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Any department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input label="Date Needed" name="targetDate" type="date" required />
              <Input label="Start Time" name="targetStartTime" type="time" required />
              <Input label="End Time" name="targetEndTime" type="time" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="People Needed" name="maxRespondents" type="number" min="1" defaultValue="1" />
              <Input label="Expires in (hours)" name="expiresInHours" type="number" min="1" defaultValue="4" />
            </div>

            {skills.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Required Skills</label>
                <p className="text-xs text-gray-500">Only volunteers with these skills will be notified</p>
                <div className="grid grid-cols-2 gap-2">
                  {skills.map((skill) => (
                    <label key={skill.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="skills" value={skill.id} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      {skill.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Link href="/broadcasts">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">Send Broadcast</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
