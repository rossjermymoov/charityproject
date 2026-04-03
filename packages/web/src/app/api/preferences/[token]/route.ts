import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/preferences/[token] - Get current preferences (public, no auth required)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find the preference token
    const preferenceToken = await prisma.preferenceToken.findUnique({
      where: { token },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            emailOptIn: true,
            smsOptIn: true,
            postOptIn: true,
            phoneOptIn: true,
            communicationFrequency: true,
            interestCategories: true,
          },
        },
      },
    });

    if (!preferenceToken) {
      return NextResponse.json(
        { error: "Invalid or expired preference link" },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (
      preferenceToken.expiresAt &&
      preferenceToken.expiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "Preference link has expired" },
        { status: 410 }
      );
    }

    const { contact } = preferenceToken;

    return NextResponse.json({
      contactId: contact.id,
      firstName: contact.firstName,
      email: contact.email,
      phone: contact.phone,
      preferences: {
        emailOptIn: contact.emailOptIn,
        smsOptIn: contact.smsOptIn,
        postOptIn: contact.postOptIn,
        phoneOptIn: contact.phoneOptIn,
        communicationFrequency: contact.communicationFrequency || "WEEKLY",
        interestCategories: contact.interestCategories || [],
      },
    });
  } catch (error) {
    console.error("Failed to fetch preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// PUT /api/preferences/[token] - Update preferences (public, no auth required)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();

    // Find the preference token
    const preferenceToken = await prisma.preferenceToken.findUnique({
      where: { token },
    });

    if (!preferenceToken) {
      return NextResponse.json(
        { error: "Invalid or expired preference link" },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (
      preferenceToken.expiresAt &&
      preferenceToken.expiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "Preference link has expired" },
        { status: 410 }
      );
    }

    const {
      emailOptIn,
      smsOptIn,
      postOptIn,
      phoneOptIn,
      communicationFrequency,
      interestCategories,
      unsubscribeAll,
    } = body;

    // Build update data
    const updateData: any = {};

    if (unsubscribeAll === true) {
      // Unsubscribe from all communications
      updateData.emailOptIn = false;
      updateData.smsOptIn = false;
      updateData.postOptIn = false;
      updateData.phoneOptIn = false;
    } else {
      if (emailOptIn !== undefined) updateData.emailOptIn = emailOptIn;
      if (smsOptIn !== undefined) updateData.smsOptIn = smsOptIn;
      if (postOptIn !== undefined) updateData.postOptIn = postOptIn;
      if (phoneOptIn !== undefined) updateData.phoneOptIn = phoneOptIn;
    }

    if (communicationFrequency !== undefined) {
      updateData.communicationFrequency = communicationFrequency;
    }
    if (interestCategories !== undefined) {
      updateData.interestCategories = interestCategories;
    }

    // Update contact preferences
    const updatedContact = await prisma.contact.update({
      where: { id: preferenceToken.contactId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        email: true,
        emailOptIn: true,
        smsOptIn: true,
        postOptIn: true,
        phoneOptIn: true,
        communicationFrequency: true,
        interestCategories: true,
      },
    });

    return NextResponse.json({
      success: true,
      contactId: updatedContact.id,
      preferences: {
        emailOptIn: updatedContact.emailOptIn,
        smsOptIn: updatedContact.smsOptIn,
        postOptIn: updatedContact.postOptIn,
        phoneOptIn: updatedContact.phoneOptIn,
        communicationFrequency: updatedContact.communicationFrequency || "WEEKLY",
        interestCategories: updatedContact.interestCategories || [],
      },
    });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
