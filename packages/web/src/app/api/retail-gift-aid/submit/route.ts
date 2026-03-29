import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopToken, email, contactId, firstName, lastName, addressLine1, city, postcode, signedName } = body;

    if (!shopToken || !email || !signedName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate the shop
    const shop = await prisma.shop.findUnique({
      where: { qrToken: shopToken },
    });

    if (!shop || !shop.isActive) {
      return NextResponse.json({ error: "Invalid or inactive shop" }, { status: 400 });
    }

    // Get the IP address for audit trail
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    // We need to find or get a system user for createdById
    // Use the shop creator as the "system" user for auto-created records
    const systemUserId = shop.createdById;

    let finalContactId = contactId;

    // If no existing contact, create one
    if (!finalContactId) {
      if (!firstName || !lastName) {
        return NextResponse.json({ error: "First name and last name are required for new contacts" }, { status: 400 });
      }

      // Double-check no contact exists with this email (race condition guard)
      const existing = await prisma.contact.findFirst({
        where: { email: email.toLowerCase().trim(), isArchived: false },
      });

      if (existing) {
        finalContactId = existing.id;
      } else {
        const newContact = await prisma.contact.create({
          data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            addressLine1: addressLine1 || null,
            city: city || null,
            postcode: postcode || null,
            types: ["DONOR"],
            createdById: systemUserId,
          },
        });
        finalContactId = newContact.id;
      }
    } else {
      // Verify the contact exists
      const existing = await prisma.contact.findUnique({
        where: { id: finalContactId },
      });
      if (!existing) {
        return NextResponse.json({ error: "Contact not found" }, { status: 400 });
      }
    }

    // Check if contact already has an active retail gift aid
    const existingRetail = await prisma.giftAid.findFirst({
      where: {
        contactId: finalContactId,
        type: "RETAIL",
        status: "ACTIVE",
      },
    });

    if (existingRetail) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: "An active Retail Gift Aid declaration already exists for this contact.",
      });
    }

    // Create the Retail Gift Aid declaration
    const now = new Date();
    const digitalToken = crypto.randomBytes(16).toString("hex");

    await prisma.giftAid.create({
      data: {
        contactId: finalContactId,
        type: "RETAIL",
        declarationDate: now,
        startDate: now,
        endDate: null, // ongoing
        status: "ACTIVE",
        source: "DIGITAL",
        digitalToken,
        digitalSignedAt: now,
        digitalSignedIp: ip,
        digitalSignedName: signedName.trim(),
        notes: `Signed via QR code at ${shop.name}`,
        createdById: systemUserId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Retail Gift Aid submit error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
