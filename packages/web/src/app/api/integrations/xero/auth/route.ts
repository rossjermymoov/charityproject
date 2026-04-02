import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateAuthorizationUrl } from "@/lib/xero";
import crypto from "crypto";

/**
 * GET: Generate OAuth authorization URL for Xero login
 */

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const config = await prisma.xeroConfig.findUnique({
    where: { id: "default" },
  });

  if (!config?.clientId) {
    return NextResponse.json(
      { error: "Xero clientId not configured" },
      { status: 400 }
    );
  }

  // Generate state for CSRF protection
  const state = crypto.randomBytes(32).toString("hex");

  // Store state in session or DB temporarily (TODO: implement state validation)
  // For now, we'll rely on HTTPS and same-site cookies

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/xero/callback`;

  const authUrl = generateAuthorizationUrl(config.clientId, redirectUri, state);

  return NextResponse.json({
    authUrl,
    state,
  });
}
