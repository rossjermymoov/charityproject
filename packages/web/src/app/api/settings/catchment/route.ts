import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    select: { catchmentPostcodes: true },
  });

  const postcodes: string[] = settings?.catchmentPostcodes
    ? JSON.parse(settings.catchmentPostcodes)
    : [];

  return NextResponse.json({ postcodes });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { postcodes } = await request.json();
  if (!Array.isArray(postcodes)) {
    return NextResponse.json({ error: "postcodes must be an array" }, { status: 400 });
  }

  // Clean and validate postcodes
  const cleaned = postcodes
    .map((p: string) => p.trim().toUpperCase())
    .filter((p: string) => p.length > 0);

  await prisma.systemSettings.update({
    where: { id: "default" },
    data: { catchmentPostcodes: JSON.stringify(cleaned) },
  });

  return NextResponse.json({ postcodes: cleaned });
}
