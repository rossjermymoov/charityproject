import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { fetchXeroChartOfAccounts, refreshAccessToken } from "@/lib/xero";

/**
 * GET: Fetch Xero chart of accounts
 */

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const config = await prisma.xeroConfig.findUnique({
      where: { id: "default" },
    });

    if (!config?.isConnected || !config.accessToken || !config.tenantId) {
      return NextResponse.json(
        { error: "Xero not connected" },
        { status: 400 }
      );
    }

    let accessToken = config.accessToken;

    // Check if token needs refresh
    if (config.tokenExpiresAt && config.tokenExpiresAt < new Date()) {
      if (!config.clientId || !config.clientSecret || !config.refreshToken) {
        return NextResponse.json(
          { error: "Cannot refresh token" },
          { status: 400 }
        );
      }

      try {
        const tokens = await refreshAccessToken(
          {
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/xero/callback`,
          },
          config.refreshToken
        );

        await prisma.xeroConfig.update({
          where: { id: "default" },
          data: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiresAt: tokens.expiresAt,
          },
        });

        accessToken = tokens.accessToken;
      } catch (error) {
        console.error("Token refresh failed:", error);
        return NextResponse.json(
          { error: "Token refresh failed" },
          { status: 401 }
        );
      }
    }

    const accounts = await fetchXeroChartOfAccounts(
      accessToken,
      config.tenantId
    );

    return NextResponse.json({
      accounts: accounts.map((account) => ({
        code: account.Code,
        name: account.Name,
        type: account.Type,
        description: account.Description,
      })),
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch accounts",
      },
      { status: 500 }
    );
  }
}
