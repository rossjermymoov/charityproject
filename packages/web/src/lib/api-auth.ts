import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";

export async function verifyApiToken(
  request: NextRequest
): Promise<{ userId: string } | null> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix
  if (!token) {
    return null;
  }

  // Verify the token is a valid user ID
  const user = await prisma.user.findUnique({
    where: { id: token },
  });

  if (!user) {
    return null;
  }

  return { userId: user.id };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
