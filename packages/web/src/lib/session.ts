import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { SessionUser } from "./auth";

// Simple cookie-based session for MVP
// In production, replace with NextAuth.js or similar
const SESSION_COOKIE = "charity-os-session";

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    select: { id: true, email: true, name: true, role: true },
  });

  return user;
}

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(roles: string[]): Promise<SessionUser> {
  const session = await requireAuth();
  if (!roles.includes(session.role)) {
    throw new Error("Forbidden");
  }
  return session;
}
