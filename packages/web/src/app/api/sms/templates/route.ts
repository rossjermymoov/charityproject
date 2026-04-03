import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getActiveSmsTemplates,
  createSmsTemplate,
} from "@/lib/sms";

/**
 * GET /api/sms/templates
 * List all active SMS templates
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await getActiveSmsTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching SMS templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sms/templates
 * Create a new SMS template
 *
 * Body:
 * - name: string (template name)
 * - body: string (template text with {{variable}} placeholders)
 * - variables?: string[] (list of variable names)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, body: templateBody, variables } = body;

    if (!name || !templateBody) {
      return NextResponse.json(
        { error: "Template name and body are required" },
        { status: 400 }
      );
    }

    const template = await createSmsTemplate({
      name,
      body: templateBody,
      variables,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating SMS template:", error);
    return NextResponse.json(
      { error: "Failed to create SMS template" },
      { status: 500 }
    );
  }
}
