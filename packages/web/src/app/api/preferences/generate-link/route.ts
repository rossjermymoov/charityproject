import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const body = await req.json();
    const { contactId, expiresInDays } = body;

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId is required" },
        { status: 400 }
      );
    }

    // Verify contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");

    // Calculate expiration date if provided
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Create preference token
    const preferenceToken = await prisma.preferenceToken.create({
      data: {
        contactId,
        token,
        expiresAt,
      },
    });

    const preferenceUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/preferences/${token}`;

    return NextResponse.json({
      token: preferenceToken.token,
      contactId: preferenceToken.contactId,
      preferenceUrl,
      expiresAt: preferenceToken.expiresAt,
      createdAt: preferenceToken.createdAt,
    });
  } catch (error) {
    console.error("Failed to generate preference link:", error);
    return NextResponse.json(
      { error: "Failed to generate preference link" },
      { status: 500 }
    );
  }
}
