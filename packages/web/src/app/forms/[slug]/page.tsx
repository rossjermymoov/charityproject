import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PublicForm } from "./public-form";

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const form = await prisma.form.findUnique({
    where: { slug },
    include: {
      fields: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!form || form.status !== "ACTIVE") {
    notFound();
  }

  // Parse suggested amounts
  let suggestedAmounts: number[] = [];
  if (form.suggestedAmounts) {
    try {
      suggestedAmounts = JSON.parse(form.suggestedAmounts);
    } catch {
      suggestedAmounts = [];
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <PublicForm
          form={{
            id: form.id,
            title: form.title,
            description: form.description,
            primaryColor: form.primaryColor,
            thankYouMessage: form.thankYouMessage,
            type: form.type,
            consentRequired: form.consentRequired,
            consentText: form.consentText,
            giftAidEnabled: form.giftAidEnabled,
            recurringEnabled: form.recurringEnabled,
            allowCustomAmount: form.allowCustomAmount,
            suggestedAmounts,
          }}
          fields={form.fields.map((f) => ({
            id: f.id,
            label: f.label,
            type: f.type,
            placeholder: f.placeholder,
            helpText: f.helpText,
            isRequired: f.isRequired,
            options: f.options,
            fieldKey: f.fieldKey,
          }))}
        />
      </div>
    </div>
  );
}
