import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET: List all email marketing integrations
 * POST: Create new email marketing integration
 */

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const integrations = await prisma.emailMarketingSync.findMany({
    select: {
      id: true,
      provider: true,
      status: true,
      lastSyncAt: true,
      syncFrequency: true,
      settings: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ integrations });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { provider, apiKey, apiEndpoint, settings } = body;

  if (!provider || !apiKey) {
    return NextResponse.json({ error: "provider and apiKey are required" }, { status: 400 });
  }

  if (!["DOTDIGITAL", "MAILCHIMP"].includes(provider)) {
    return NextResponse.json(
      { error: "provider must be DOTDIGITAL or MAILCHIMP" },
      { status: 400 }
    );
  }

  // Create new integration
  const integration = await prisma.emailMarketingSync.create({
    data: {
      provider,
      apiKey,
      apiEndpoint,
      status: "DISCONNECTED",
      syncFrequency: settings?.syncFrequency || "MANUAL",
      settings: settings || {},
    },
  });

  return NextResponse.json(
    {
      success: true,
      id: integration.id,
    },
    { status: 201 }
  );
}
