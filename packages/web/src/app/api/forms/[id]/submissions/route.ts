import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    // Verify ownership
    const form = await prisma.form.findUnique({ where: { id } });
    if (!form || form.createdById !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [submissions, total] = await Promise.all([
      prisma.formSubmission.findMany({
        where: { formId: id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.formSubmission.count({ where: { formId: id } }),
    ]);

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  try {
    // Check if form exists and is active
    const form = await prisma.form.findUnique({
      where: { id },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Form is not active" },
        { status: 400 }
      );
    }

    // Create submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId: id,
        data: JSON.stringify(body.data || {}),
        contactId: body.contactId || null,
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
        referrer: body.referrer || null,
      },
    });

    // Send notification email if configured
    if (form.notifyEmail) {
      // TODO: Implement email notification
      console.log(`[TODO] Send form submission email to ${form.notifyEmail}`);
    }

    return NextResponse.json({ id: submission.id, success: true }, { status: 201 });
  } catch (error) {
    console.error("Form submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
