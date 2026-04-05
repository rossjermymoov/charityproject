import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const template = await prisma.emailTemplate.findUnique({ where: { id } });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name: body.name,
        subject: body.subject,
        bodyHtml: body.bodyHtml,
        bodyText: body.bodyText || null,
        logoUrl: body.logoUrl || null,
        category: body.category || "GENERAL",
        variables: body.variables || [],
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    await prisma.emailTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
