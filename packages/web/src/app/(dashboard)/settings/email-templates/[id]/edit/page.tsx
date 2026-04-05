import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { redirect } from "next/navigation";
import TemplateEditor from "../../template-editor";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "STAFF"]);
  const { id } = await params;

  const template = await prisma.emailTemplate.findUnique({
    where: { id },
  });

  if (!template) redirect("/settings/email-templates");

  return (
    <TemplateEditor
      mode="edit"
      templateId={template.id}
      initial={{
        name: template.name,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText || "",
        logoUrl: template.logoUrl || "",
        category: template.category,
        isActive: template.isActive,
      }}
    />
  );
}
