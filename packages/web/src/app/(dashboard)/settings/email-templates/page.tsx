import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Edit2, Eye, Trash2 } from "lucide-react";
import { revalidatePath } from "next/cache";

export const metadata = {
  title: "Email Templates",
};

export default async function EmailTemplatesPage() {
  await requireRole(["ADMIN", "STAFF"]);

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  async function deleteTemplate(templateId: string) {
    "use server";
    await requireAuth();

    await prisma.emailTemplate.delete({
      where: { id: templateId },
    });

    revalidatePath("/settings/email-templates");
  }

  const categoryLabels: Record<string, string> = {
    THANK_YOU: "Thank You",
    WELCOME: "Welcome",
    RECEIPT: "Receipt",
    RENEWAL: "Renewal",
    CUSTOM: "Custom",
    GENERAL: "General",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-500 mt-1">
            Create email templates for automation rules
          </p>
        </div>
        <Link href="/settings/email-templates/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </Link>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500 mb-4">No email templates yet</p>
            <Link href="/settings/email-templates/new">
              <Button>Create Your First Template</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Template Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {templates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {template.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            by {template.createdBy.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {template.subject.substring(0, 50)}
                        {template.subject.length > 50 ? "..." : ""}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                          {categoryLabels[template.category] || template.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {template.isActive ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/settings/email-templates/${template.id}`}
                            title="View template"
                          >
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link
                            href={`/settings/email-templates/${template.id}/edit`}
                            title="Edit template"
                          >
                            <Button variant="ghost" size="sm">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </Link>
                          <form action={deleteTemplate.bind(null, template.id)}>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="submit"
                              title="Delete template"
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
