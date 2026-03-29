import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

const DEFAULT_FIELDS: Record<string, Array<{ label: string; type: string; fieldKey?: string; isRequired: boolean; isSystem: boolean }>> = {
  DONATION: [
    { label: "First Name", type: "TEXT", fieldKey: "firstName", isRequired: true, isSystem: true },
    { label: "Last Name", type: "TEXT", fieldKey: "lastName", isRequired: true, isSystem: true },
    { label: "Email", type: "EMAIL", fieldKey: "email", isRequired: true, isSystem: true },
    { label: "Donation Amount", type: "AMOUNT", fieldKey: "amount", isRequired: true, isSystem: true },
  ],
  SIGNUP: [
    { label: "First Name", type: "TEXT", fieldKey: "firstName", isRequired: true, isSystem: true },
    { label: "Last Name", type: "TEXT", fieldKey: "lastName", isRequired: true, isSystem: true },
    { label: "Email", type: "EMAIL", fieldKey: "email", isRequired: true, isSystem: true },
    { label: "Phone", type: "PHONE", fieldKey: "phone", isRequired: false, isSystem: true },
  ],
  CONTACT: [
    { label: "First Name", type: "TEXT", fieldKey: "firstName", isRequired: true, isSystem: true },
    { label: "Last Name", type: "TEXT", fieldKey: "lastName", isRequired: true, isSystem: true },
    { label: "Email", type: "EMAIL", fieldKey: "email", isRequired: true, isSystem: true },
    { label: "Phone", type: "PHONE", fieldKey: "phone", isRequired: false, isSystem: true },
    { label: "Message", type: "TEXTAREA", fieldKey: null as unknown as undefined, isRequired: true, isSystem: false },
  ],
  EVENT: [
    { label: "First Name", type: "TEXT", fieldKey: "firstName", isRequired: true, isSystem: true },
    { label: "Last Name", type: "TEXT", fieldKey: "lastName", isRequired: true, isSystem: true },
    { label: "Email", type: "EMAIL", fieldKey: "email", isRequired: true, isSystem: true },
    { label: "Phone", type: "PHONE", fieldKey: "phone", isRequired: false, isSystem: true },
  ],
  VOLUNTEER: [
    { label: "First Name", type: "TEXT", fieldKey: "firstName", isRequired: true, isSystem: true },
    { label: "Last Name", type: "TEXT", fieldKey: "lastName", isRequired: true, isSystem: true },
    { label: "Email", type: "EMAIL", fieldKey: "email", isRequired: true, isSystem: true },
    { label: "Phone", type: "PHONE", fieldKey: "phone", isRequired: false, isSystem: true },
    { label: "Skills & Experience", type: "TEXTAREA", isRequired: false, isSystem: false },
    { label: "Availability", type: "TEXTAREA", isRequired: false, isSystem: false },
  ],
  CUSTOM: [
    { label: "First Name", type: "TEXT", fieldKey: "firstName", isRequired: true, isSystem: true },
    { label: "Last Name", type: "TEXT", fieldKey: "lastName", isRequired: true, isSystem: true },
    { label: "Email", type: "EMAIL", fieldKey: "email", isRequired: true, isSystem: true },
  ],
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    type, name, title, description, primaryColor, thankYouMessage,
    consentText, notifyEmail, suggestedAmounts, allowCustomAmount,
    giftAidEnabled, recurringEnabled,
  } = body;

  // Generate unique slug
  let slug = slugify(name || "form");
  const existing = await prisma.form.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // Parse suggested amounts to JSON array
  let suggestedAmountsJson: string | null = null;
  if (type === "DONATION" && suggestedAmounts) {
    const amounts = suggestedAmounts
      .split(",")
      .map((s: string) => parseFloat(s.trim()))
      .filter((n: number) => !isNaN(n));
    suggestedAmountsJson = JSON.stringify(amounts);
  }

  const form = await prisma.form.create({
    data: {
      name,
      slug,
      type,
      status: "DRAFT",
      title: title || name,
      description: description || null,
      primaryColor: primaryColor || "#4F46E5",
      thankYouMessage: thankYouMessage || "Thank you for your submission!",
      consentText: consentText || null,
      notifyEmail: notifyEmail || null,
      suggestedAmounts: suggestedAmountsJson,
      allowCustomAmount: allowCustomAmount ?? true,
      giftAidEnabled: giftAidEnabled ?? false,
      recurringEnabled: recurringEnabled ?? false,
      createdById: session.id,
      fields: {
        create: (DEFAULT_FIELDS[type] || DEFAULT_FIELDS.CUSTOM).map((field, index) => ({
          label: field.label,
          type: field.type,
          fieldKey: field.fieldKey || null,
          isRequired: field.isRequired,
          isSystem: field.isSystem,
          sortOrder: index,
        })),
      },
    },
  });

  return NextResponse.json({ id: form.id, slug: form.slug });
}
