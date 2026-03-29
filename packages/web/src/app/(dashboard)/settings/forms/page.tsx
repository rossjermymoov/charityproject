import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, FileInput, Eye, Code, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { formatDate } from "@/lib/utils";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";

const typeColors: Record<string, string> = {
  DONATION: "bg-green-100 text-green-800",
  SIGNUP: "bg-blue-100 text-blue-800",
  CONTACT: "bg-purple-100 text-purple-800",
  EVENT: "bg-orange-100 text-orange-800",
  VOLUNTEER: "bg-yellow-100 text-yellow-800",
  CUSTOM: "bg-gray-100 text-gray-800",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  DRAFT: "bg-yellow-100 text-yellow-800",
  PAUSED: "bg-orange-100 text-orange-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
};

export default async function FormsListPage() {
  await requireAuth();

  const forms = await prisma.form.findMany({
    include: {
      _count: { select: { submissions: true } },
      submissions: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalForms = forms.length;
  const activeForms = forms.filter((f) => f.status === "ACTIVE").length;
  const totalSubmissions = forms.reduce((sum, f) => sum + f._count.submissions, 0);

  async function toggleFormStatus(formData: FormData) {
    "use server";
    const formId = formData.get("formId") as string;
    const newStatus = formData.get("newStatus") as string;
    await prisma.form.update({ where: { id: formId }, data: { status: newStatus } });
    revalidatePath("/settings/forms");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <p className="text-gray-500 mt-1">
            Create embeddable forms for donations, signups, and more
          </p>
        </div>
        <Link href="/settings/forms/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Form
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Forms" value={totalForms} icon={FileInput} />
        <StatCard title="Active Forms" value={activeForms} icon={Play} />
        <StatCard title="Total Submissions" value={totalSubmissions} icon={Eye} />
      </div>

      {forms.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileInput}
            title="No forms yet"
            description="Create your first form to start collecting donations, signups, and more."
            actionLabel="Create Form"
            actionHref="/settings/forms/new"
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Submission
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {forms.map((form) => (
                  <tr key={form.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/settings/forms/${form.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {form.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">/forms/{form.slug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={typeColors[form.type] || "bg-gray-100 text-gray-800"}>
                        {form.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[form.status] || "bg-gray-100 text-gray-800"}>
                        {form.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{form._count.submissions}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {form.submissions[0]
                        ? formatDate(form.submissions[0].createdAt)
                        : "No submissions"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/settings/forms/${form.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/settings/forms/${form.id}/submissions`}>
                          <Button variant="ghost" size="sm">
                            <Code className="h-4 w-4" />
                          </Button>
                        </Link>
                        <form action={toggleFormStatus}>
                          <input type="hidden" name="formId" value={form.id} />
                          <input
                            type="hidden"
                            name="newStatus"
                            value={form.status === "ACTIVE" ? "PAUSED" : "ACTIVE"}
                          />
                          <Button variant="ghost" size="sm" type="submit">
                            {form.status === "ACTIVE" ? (
                              <Pause className="h-4 w-4 text-orange-500" />
                            ) : (
                              <Play className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
