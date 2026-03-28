import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, fullName, confirm } = body;

    if (!token || !fullName || !confirm) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Find the gift aid record by token
    const giftAid = await prisma.giftAid.findUnique({
      where: { digitalToken: token },
      include: { contact: true },
    });

    if (!giftAid) {
      return NextResponse.json(
        { error: "Invalid or expired declaration link" },
        { status: 404 }
      );
    }

    if (giftAid.digitalSignedAt) {
      return NextResponse.json(
        { error: "This declaration has already been signed" },
        { status: 400 }
      );
    }

    if (giftAid.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This declaration is no longer active" },
        { status: 400 }
      );
    }

    // Get IP address for audit
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Update with digital signature
    await prisma.giftAid.update({
      where: { id: giftAid.id },
      data: {
        digitalSignedAt: new Date(),
        digitalSignedIp: ip,
        digitalSignedName: fullName,
        source: "DIGITAL",
        declarationDate: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Declaration error:", error);
    return NextResponse.json(
      { error: "Failed to process declaration" },
      { status: 500 }
    );
  }
}
