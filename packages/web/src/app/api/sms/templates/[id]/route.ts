import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getSmsTemplate,
  updateSmsTemplate,
  deleteSmsTemplate,
} from "@/lib/sms";

/**
 * GET /api/sms/templates/[id]
 * Get a single SMS template by ID
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const template = await getSmsTemplate(id);

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching SMS template:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS template" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sms/templates/[id]
 * Update an SMS template
 *
 * Body:
 * - name?: string
 * - body?: string
 * - variables?: string[]
 * - isActive?: boolean
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const template = await updateSmsTemplate(id, body);

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating SMS template:", error);
    const message =
      error instanceof Error && error.message.includes("not found")
        ? "Template not found"
        : "Failed to update SMS template";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message.includes("not found") ? 404 : 500 }
    );
  }
}

/**
 * DELETE /api/sms/templates/[id]
 * Delete an SMS template
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    await deleteSmsTemplate(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting SMS template:", error);
    const message =
      error instanceof Error && error.message.includes("not found")
        ? "Template not found"
        : "Failed to delete SMS template";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message.includes("not found") ? 404 : 500 }
    );
  }
}
