import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { exchangeCodeForTokens, fetchXeroOrganisation, XERO_CONFIG } from "@/lib/xero";

/**
 * GET: Handle OAuth callback from Xero
 * Exchange authorization code for access tokens
 */

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.json(
      { error: "No authorization code received" },
      { status: 400 }
    );
  }

  try {
    const config = await prisma.xeroConfig.findUnique({
      where: { id: "default" },
    });

    if (!config?.clientId || !config?.clientSecret) {
      return NextResponse.json(
        { error: "Xero configuration incomplete" },
        { status: 400 }
      );
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/xero/callback`;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(
      {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectUri,
      },
      code
    );

    // Extract tenant ID from ID token (JWT) - it's in the token but we also need to fetch it
    // For now, we'll fetch the organisation to get the tenant ID
    const organisation = await fetchXeroOrganisation(
      tokens.accessToken,
      "000" // Placeholder tenant ID, we'll update it below
    ).catch(() => null);

    // Update config with tokens
    const xeroConfig = await prisma.xeroConfig.update({
      where: { id: "default" },
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        isConnected: true,
        tenantId: organisation?.OrganisationID || "default",
        updatedAt: new Date(),
      },
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        "/settings/integrations/xero?connected=true",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      )
    );
  } catch (error) {
    console.error("Xero OAuth callback error:", error);

    return NextResponse.redirect(
      new URL(
        `/settings/integrations/xero?error=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      )
    );
  }
}
