import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    select: { letterheadImage: true },
  });

  return NextResponse.json({ letterheadImage: settings?.letterheadImage || null });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  // If no file, clear the letterhead
  if (!file) {
    await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: { letterheadImage: null },
      create: { id: "default", letterheadImage: null },
    });
    return NextResponse.json({ success: true, letterheadImage: null });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
  }

  // Validate file size (2MB max for letterhead)
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 2MB" }, { status: 400 });
  }

  // Convert to base64 data URL
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: { letterheadImage: dataUrl },
    create: { id: "default", letterheadImage: dataUrl },
  });

  return NextResponse.json({ success: true, letterheadImage: dataUrl });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: { letterheadImage: null },
    create: { id: "default", letterheadImage: null },
  });

  return NextResponse.json({ success: true });
}
