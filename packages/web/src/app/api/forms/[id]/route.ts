import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        fields: { orderBy: { sortOrder: "asc" } },
        _count: { select: { submissions: true } },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json(form);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const {
    name,
    title,
    description,
    primaryColor,
    thankYouMessage,
    consentText,
    notifyEmail,
    fields,
  } = body;

  try {
    // Verify ownership
    const form = await prisma.form.findUnique({ where: { id } });
    if (!form || form.createdById !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update form
    const updated = await prisma.form.update({
      where: { id },
      data: {
        name: name || undefined,
        title: title || undefined,
        description: description || null,
        primaryColor: primaryColor || undefined,
        thankYouMessage: thankYouMessage || undefined,
        consentText: consentText || null,
        notifyEmail: notifyEmail || null,
      },
      include: {
        fields: { orderBy: { sortOrder: "asc" } },
      },
    });

    // Update fields if provided
    if (fields && Array.isArray(fields)) {
      // Delete removed fields
      const fieldIds = fields.map((f: any) => f.id || `new-${f.order}`);
      await prisma.formField.deleteMany({
        where: {
          formId: id,
          id: { notIn: fieldIds.filter((id: string) => !id.startsWith("new-")) },
        },
      });

      // Upsert fields
      for (const field of fields) {
        const fieldData = {
          formId: id,
          label: field.label,
          type: field.type,
          placeholder: field.placeholder || null,
          helpText: field.helpText || null,
          isRequired: field.required,
          options: field.options ? JSON.stringify(field.options) : null,
          sortOrder: field.order,
        };

        if (field.id && !field.id.startsWith("new-")) {
          await prisma.formField.update({
            where: { id: field.id },
            data: fieldData,
          });
        } else {
          await prisma.formField.create({ data: fieldData });
        }
      }
    }

    const updatedForm = await prisma.form.findUnique({
      where: { id },
      include: {
        fields: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error("Form update error:", error);
    return NextResponse.json(
      { error: "Failed to update form" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    // Verify ownership
    const form = await prisma.form.findUnique({ where: { id } });
    if (!form || form.createdById !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.form.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete form" },
      { status: 500 }
    );
  }
}
