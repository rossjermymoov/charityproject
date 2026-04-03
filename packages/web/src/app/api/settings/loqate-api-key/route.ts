import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * POST /api/settings/loqate-api-key
 * Save the Loqate API key to system settings
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json() as { apiKey?: unknown };

    if (typeof body.apiKey !== "string") {
      return NextResponse.json(
        { error: "apiKey must be a string" },
        { status: 400 }
      );
    }

    await prisma.systemSettings.update({
      where: { id: "default" },
      data: { loqateApiKey: body.apiKey.trim() || null },
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error saving Loqate API key:", message);
    return NextResponse.json(
      { error: "Failed to save Loqate API key" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/settings/loqate-api-key
 * Get the current Loqate API key status (does not return the actual key)
 */
export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
      select: { loqateApiKey: true },
    });

    const isConfigured = !!settings?.loqateApiKey;

    return NextResponse.json({ isConfigured });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching Loqate API key status:", message);
    return NextResponse.json(
      { error: "Failed to fetch Loqate API key status" },
      { status: 500 }
    );
  }
}
