import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET: Retrieve Xero configuration status
 * POST: Save Xero configuration (clientId, clientSecret)
 */

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const config = await prisma.xeroConfig.findUnique({
    where: { id: "default" },
    select: {
      id: true,
      isConnected: true,
      tenantId: true,
      lastSyncAt: true,
      clientId: true,
      accessToken: true,
      tokenExpiresAt: true,
    },
  });

  if (!config) {
    return NextResponse.json({
      isConnected: false,
      tenantId: null,
      lastSyncAt: null,
    });
  }

  return NextResponse.json({
    isConnected: config.isConnected,
    tenantId: config.tenantId,
    lastSyncAt: config.lastSyncAt,
    clientId: config.clientId ? config.clientId.substring(0, 10) + "..." : null,
    hasAccessToken: !!config.accessToken,
    tokenExpiresAt: config.tokenExpiresAt,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { clientId, clientSecret } = body;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "clientId and clientSecret are required" },
      { status: 400 }
    );
  }

  // Upsert config (create if not exists)
  const config = await prisma.xeroConfig.upsert({
    where: { id: "default" },
    update: {
      clientId,
      clientSecret,
      updatedAt: new Date(),
    },
    create: {
      id: "default",
      clientId,
      clientSecret,
      isConnected: false,
    },
  });

  return NextResponse.json({
    saved: true,
    id: config.id,
  });
}
