import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { description } = await request.json();
  if (typeof description !== "string") {
    return NextResponse.json({ error: "description must be a string" }, { status: 400 });
  }

  await prisma.systemSettings.update({
    where: { id: "default" },
    data: { charityDescription: description.trim() || null },
  });

  return NextResponse.json({ saved: true });
}
