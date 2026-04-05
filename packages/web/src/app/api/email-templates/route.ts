import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const templates = await prisma.emailTemplate.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await req.json();

    const template = await prisma.emailTemplate.create({
      data: {
        name: body.name,
        subject: body.subject,
        bodyHtml: body.bodyHtml,
        bodyText: body.bodyText || null,
        logoUrl: body.logoUrl || null,
        category: body.category || "GENERAL",
        variables: body.variables || [],
        isActive: body.isActive ?? true,
        createdById: session.id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating email template:", error);
    return NextResponse.json(
      { error: "Failed to create email template" },
      { status: 500 }
    );
  }
}
