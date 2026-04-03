import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET: Retrieve a specific email marketing integration
 * PUT: Update a specific email marketing integration
 * DELETE: Delete a specific email marketing integration
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  const integration = await prisma.emailMarketingSync.findUnique({
    where: { id },
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
  });

  if (!integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  return NextResponse.json({ integration });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { apiKey, apiEndpoint, status, syncFrequency, settings } = body;

  const integration = await prisma.emailMarketingSync.findUnique({
    where: { id },
  });

  if (!integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  const updated = await prisma.emailMarketingSync.update({
    where: { id },
    data: {
      ...(apiKey && { apiKey }),
      ...(apiEndpoint && { apiEndpoint }),
      ...(status && { status }),
      ...(syncFrequency && { syncFrequency }),
      ...(settings && { settings }),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, integration: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  const integration = await prisma.emailMarketingSync.findUnique({
    where: { id },
  });

  if (!integration) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  await prisma.emailMarketingSync.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
