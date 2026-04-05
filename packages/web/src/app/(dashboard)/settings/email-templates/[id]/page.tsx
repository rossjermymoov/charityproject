import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

const categoryLabels: Record<string, string> = {
  THANK_YOU: "Thank You",
  WELCOME: "Welcome",
  RECEIPT: "Receipt",
  RENEWAL: "Renewal",
  EVENT: "Event",
  VOLUNTEER: "Volunteer",
  MEMBERSHIP: "Membership",
  GENERAL: "General",
  CUSTOM: "Custom",
};

export default async function ViewTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "STAFF"]);
  const { id } = await params;

  const template = await prisma.emailTemplate.findUnique({
    where: { id },
    include: { createdBy: { select: { name: true } } },
  });

  if (!template) redirect("/settings/email-templates");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings/email-templates" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
            <p className="text-sm text-gray-500">
              {categoryLabels[template.category] || template.category} · Created by {template.createdBy.name} · {formatDate(template.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/settings/email-templates/${id}/edit`}>
            <Button className="flex items-center gap-2">
              <Edit2 className="h-4 w-4" /> Edit Template
            </Button>
          </Link>
        </div>
      </div>

      {/* Status */}
      <div className="flex gap-2">
        {template.isActive ? (
          <span className="inline-flex items-center rounded-md bg-green-100 text-green-800 px-2.5 py-1 text-xs font-semibold">Active</span>
        ) : (
          <span className="inline-flex items-center rounded-md bg-gray-100 text-gray-800 px-2.5 py-1 text-xs font-semibold">Inactive</span>
        )}
        <span className="inline-flex items-center rounded-md bg-purple-100 text-purple-800 px-2.5 py-1 text-xs font-semibold">
          {categoryLabels[template.category] || template.category}
        </span>
      </div>

      {/* Email Preview */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Email Preview</h2>
          <div className="border rounded-lg overflow-hidden bg-white max-w-2xl mx-auto">
            {/* Logo header */}
            {template.logoUrl && (
              <div className="bg-gray-50 border-b p-4 text-center">
                <img src={template.logoUrl} alt="Logo" className="max-h-14 mx-auto object-contain" />
              </div>
            )}
            {/* Subject */}
            <div className="px-6 py-3 border-b bg-gray-50">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Subject</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{template.subject}</p>
            </div>
            {/* Body */}
            <div className="px-6 py-4 text-sm text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: template.bodyHtml }} />
          </div>
        </CardContent>
      </Card>

      {/* Raw HTML */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">HTML Source</h2>
          </div>
          <pre className="bg-gray-50 rounded-lg p-4 text-xs font-mono text-gray-700 overflow-auto max-h-64 border">
            {template.bodyHtml}
          </pre>
        </CardContent>
      </Card>

      {/* Plain text version */}
      {template.bodyText && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Plain Text Version</h2>
            <pre className="bg-gray-50 rounded-lg p-4 text-xs font-mono text-gray-700 overflow-auto max-h-48 border whitespace-pre-wrap">
              {template.bodyText}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
