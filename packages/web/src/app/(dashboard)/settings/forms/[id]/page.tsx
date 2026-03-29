import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Copy,
  ExternalLink,
  Play,
  Pause,
  Archive,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const fieldTypeLabels: Record<string, string> = {
  TEXT: "Text",
  EMAIL: "Email",
  PHONE: "Phone",
  TEXTAREA: "Long Text",
  SELECT: "Dropdown",
  CHECKBOX: "Checkbox",
  NUMBER: "Number",
  DATE: "Date",
  AMOUNT: "Amount (£)",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  DRAFT: "bg-yellow-100 text-yellow-800",
  PAUSED: "bg-orange-100 text-orange-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
};

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const form = await prisma.form.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { sortOrder: "asc" } },
      _count: { select: { submissions: true } },
    },
  });

  if (!form) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com";

  async function updateForm(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const primaryColor = formData.get("primaryColor") as string;
    const thankYouMessage = formData.get("thankYouMessage") as string;
    const consentText = formData.get("consentText") as string;
    const notifyEmail = formData.get("notifyEmail") as string;

    await prisma.form.update({
      where: { id },
      data: {
        name: name || undefined,
        title: title || undefined,
        description: description || null,
        primaryColor: primaryColor || "#4F46E5",
        thankYouMessage: thankYouMessage || "Thank you!",
        consentText: consentText || null,
        notifyEmail: notifyEmail || null,
      },
    });
    revalidatePath(`/settings/forms/${id}`);
  }

  async function addField(formData: FormData) {
    "use server";
    const label = formData.get("label") as string;
    const type = formData.get("type") as string;
    const placeholder = formData.get("placeholder") as string;
    const isRequired = formData.get("isRequired") === "true";

    const maxOrder = await prisma.formField.findFirst({
      where: { formId: id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    await prisma.formField.create({
      data: {
        formId: id,
        label,
        type,
        placeholder: placeholder || null,
        isRequired,
        isSystem: false,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
    });
    revalidatePath(`/settings/forms/${id}`);
  }

  async function removeField(formData: FormData) {
    "use server";
    const fieldId = formData.get("fieldId") as string;
    await prisma.formField.delete({ where: { id: fieldId } });
    revalidatePath(`/settings/forms/${id}`);
  }

  async function moveField(formData: FormData) {
    "use server";
    const fieldId = formData.get("fieldId") as string;
    const direction = formData.get("direction") as string;

    const fields = await prisma.formField.findMany({
      where: { formId: id },
      orderBy: { sortOrder: "asc" },
    });

    const idx = fields.findIndex((f) => f.id === fieldId);
    if (idx < 0) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= fields.length) return;

    await prisma.$transaction([
      prisma.formField.update({
        where: { id: fields[idx].id },
        data: { sortOrder: fields[swapIdx].sortOrder },
      }),
      prisma.formField.update({
        where: { id: fields[swapIdx].id },
        data: { sortOrder: fields[idx].sortOrder },
      }),
    ]);
    revalidatePath(`/settings/forms/${id}`);
  }

  async function changeStatus(formData: FormData) {
    "use server";
    const newStatus = formData.get("newStatus") as string;
    await prisma.form.update({ where: { id }, data: { status: newStatus } });
    revalidatePath(`/settings/forms/${id}`);
  }

  async function deleteForm() {
    "use server";
    await prisma.form.delete({ where: { id } });
    redirect("/settings/forms");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings/forms">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
              <Badge className={statusColors[form.status]}>{form.status}</Badge>
            </div>
            <p className="text-gray-500 mt-1">
              /forms/{form.slug} &middot; {form._count.submissions} submissions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {form.status === "ACTIVE" && (
            <a href={`${appUrl}/forms/${form.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </a>
          )}
          <Link href={`/settings/forms/${id}/submissions`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Submissions
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <Badge className={statusColors[form.status]}>{form.status}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {form.status !== "ACTIVE" && (
              <form action={changeStatus}>
                <input type="hidden" name="newStatus" value="ACTIVE" />
                <Button variant="outline" size="sm" type="submit">
                  <Play className="h-4 w-4 mr-1 text-green-600" />
                  Activate
                </Button>
              </form>
            )}
            {form.status === "ACTIVE" && (
              <form action={changeStatus}>
                <input type="hidden" name="newStatus" value="PAUSED" />
                <Button variant="outline" size="sm" type="submit">
                  <Pause className="h-4 w-4 mr-1 text-orange-600" />
                  Pause
                </Button>
              </form>
            )}
            {form.status !== "ARCHIVED" && (
              <form action={changeStatus}>
                <input type="hidden" name="newStatus" value="ARCHIVED" />
                <Button variant="outline" size="sm" type="submit">
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </Button>
              </form>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Form Settings</h2>
          </CardHeader>
          <CardContent>
            <form action={updateForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  name="name"
                  defaultValue={form.name}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  name="title"
                  defaultValue={form.title}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={form.description || ""}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Colour</label>
                  <input
                    name="primaryColor"
                    defaultValue={form.primaryColor}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notify Email
                  </label>
                  <input
                    name="notifyEmail"
                    defaultValue={form.notifyEmail || ""}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thank You Message
                </label>
                <input
                  name="thankYouMessage"
                  defaultValue={form.thankYouMessage}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consent Text
                </label>
                <input
                  name="consentText"
                  defaultValue={form.consentText || ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <Button type="submit" size="sm">
                Save Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Fields */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Form Fields ({form.fields.length})
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {form.fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{field.label}</span>
                    <Badge className="bg-gray-200 text-gray-600">
                      {fieldTypeLabels[field.type] || field.type}
                    </Badge>
                    {field.isRequired && (
                      <Badge className="bg-red-100 text-red-700">Required</Badge>
                    )}
                    {field.isSystem && (
                      <Badge className="bg-indigo-100 text-indigo-700">System</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {idx > 0 && (
                      <form action={moveField}>
                        <input type="hidden" name="fieldId" value={field.id} />
                        <input type="hidden" name="direction" value="up" />
                        <Button variant="ghost" size="icon" type="submit">
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                      </form>
                    )}
                    {idx < form.fields.length - 1 && (
                      <form action={moveField}>
                        <input type="hidden" name="fieldId" value={field.id} />
                        <input type="hidden" name="direction" value="down" />
                        <Button variant="ghost" size="icon" type="submit">
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </form>
                    )}
                    {!field.isSystem && (
                      <form action={removeField}>
                        <input type="hidden" name="fieldId" value={field.id} />
                        <Button variant="ghost" size="icon" type="submit">
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Field */}
            <form action={addField} className="p-3 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-sm font-medium text-gray-700 mb-2">Add Field</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  name="label"
                  placeholder="Field label"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                />
                <select
                  name="type"
                  defaultValue="TEXT"
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                >
                  {Object.entries(fieldTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <input
                  name="placeholder"
                  placeholder="Placeholder text (optional)"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                />
                <label className="flex items-center gap-1.5 text-sm text-gray-600">
                  <input type="hidden" name="isRequired" value="false" />
                  <input
                    type="checkbox"
                    name="isRequired"
                    value="true"
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  Required
                </label>
              </div>
              <Button type="submit" size="sm" variant="outline">
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Embed Code */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Embed Code</h2>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-3">
            Copy the code below and paste it into your website to embed this form.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                Direct Link
              </label>
              <code className="block p-3 bg-gray-900 text-green-400 text-sm rounded-lg overflow-x-auto">
                {appUrl}/forms/{form.slug}
              </code>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                Iframe Embed
              </label>
              <code className="block p-3 bg-gray-900 text-green-400 text-sm rounded-lg overflow-x-auto whitespace-pre">
                {`<iframe src="${appUrl}/forms/${form.slug}" width="100%" height="600" frameborder="0" style="border:none;"></iframe>`}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Delete Form</p>
              <p className="text-xs text-gray-500">
                This will permanently delete this form and all its submissions.
              </p>
            </div>
            <form action={deleteForm}>
              <Button variant="destructive" size="sm" type="submit">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
