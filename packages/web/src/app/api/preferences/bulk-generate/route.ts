import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const body = await req.json();
    const { contactIds, expiresInDays } = body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: "contactIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Verify all contacts exist
    const contacts = await prisma.contact.findMany({
      where: {
        id: {
          in: contactIds,
        },
      },
      select: { id: true },
    });

    if (contacts.length !== contactIds.length) {
      return NextResponse.json(
        { error: "Some contacts were not found" },
        { status: 404 }
      );
    }

    // Calculate expiration date if provided
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Create preference tokens for all contacts
    const tokens = await Promise.all(
      contactIds.map((contactId) =>
        prisma.preferenceToken.create({
          data: {
            contactId,
            token: crypto.randomBytes(32).toString("hex"),
            expiresAt,
          },
        })
      )
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const results = tokens.map((token) => ({
      token: token.token,
      contactId: token.contactId,
      preferenceUrl: `${baseUrl}/preferences/${token.token}`,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
    }));

    return NextResponse.json({
      success: true,
      count: results.length,
      tokens: results,
    });
  } catch (error) {
    console.error("Failed to generate preference links:", error);
    return NextResponse.json(
      { error: "Failed to generate preference links" },
      { status: 500 }
    );
  }
}
