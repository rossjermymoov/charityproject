import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * POST: Disconnect Xero integration
 * Clears all tokens and configuration
 */

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await prisma.xeroConfig.update({
    where: { id: "default" },
    data: {
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      isConnected: false,
      tenantId: null,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    disconnected: true,
  });
}
