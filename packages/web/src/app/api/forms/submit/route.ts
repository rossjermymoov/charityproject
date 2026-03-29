import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { formId, data, amount, isRecurring, giftAidDeclared } = body;

    if (!formId || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch the form with fields
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { fields: true },
    });

    if (!form || form.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Form not found or inactive" },
        { status: 404 }
      );
    }

    // Validate required fields
    for (const field of form.fields) {
      if (field.isRequired && field.type !== "AMOUNT") {
        const key = field.fieldKey || field.id;
        if (!data[key] || data[key].trim() === "") {
          return NextResponse.json(
            { error: `${field.label} is required` },
            { status: 400 }
          );
        }
      }
    }

    // Validate donation amount
    if (form.type === "DONATION") {
      if (!amount || amount <= 0) {
        return NextResponse.json(
          { error: "A valid donation amount is required" },
          { status: 400 }
        );
      }
    }

    // Find or create contact by email
    const email = data.email?.trim().toLowerCase();
    const firstName = data.firstName?.trim() || "";
    const lastName = data.lastName?.trim() || "";
    let contactId: string | null = null;

    if (email) {
      let contact = await prisma.contact.findFirst({
        where: { email },
      });

      if (contact) {
        contactId = contact.id;
      } else {
        const newContact = await prisma.contact.create({
          data: {
            firstName,
            lastName,
            email,
            phone: data.phone?.trim() || null,
            types: form.type === "DONATION" ? ["DONOR"] : [],
            status: "ACTIVE",
            createdById: form.createdById,
          },
        });
        contactId = newContact.id;
      }
    }

    // Create form submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        contactId,
        data: JSON.stringify(data),
        amount: form.type === "DONATION" ? amount : null,
        isRecurring: isRecurring || false,
        giftAidDeclared: giftAidDeclared || false,
        status: "RECEIVED",
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          null,
        userAgent: request.headers.get("user-agent") || null,
        referrer: request.headers.get("referer") || null,
      },
    });

    // If donation form, also create a Donation record
    if (form.type === "DONATION" && amount > 0 && contactId) {
      await prisma.donation.create({
        data: {
          contactId,
          amount,
          currency: "GBP",
          type: "DONATION",
          method: "ONLINE",
          isGiftAidable: giftAidDeclared || false,
          giftAidClaimed: false,
          status: "RECEIVED",
          date: new Date(),
          reference: `FORM-${submission.id.substring(0, 8).toUpperCase()}`,
          notes: `Submitted via form: ${form.name}${isRecurring ? " (Monthly)" : ""}`,
          createdById: form.createdById,
        },
      });
    }

    return NextResponse.json({ success: true, id: submission.id });
  } catch (error) {
    console.error("Form submission error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
