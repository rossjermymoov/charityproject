import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: "Token and email are required" },
        { status: 400 }
      );
    }

    const notification = await prisma.retailGiftAidNotification.findUnique({
      where: { token },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 404 }
      );
    }

    if (notification.emailConsented) {
      return NextResponse.json(
        { error: "Already consented" },
        { status: 400 }
      );
    }

    // Record the email consent on the notification
    await prisma.retailGiftAidNotification.update({
      where: { token },
      data: {
        emailConsented: true,
        emailConsentAt: new Date(),
      },
    });

    // Update the contact's email and consent preferences
    await prisma.contact.update({
      where: { id: notification.contactId },
      data: {
        email: email,
        consentEmail: true,
        consentUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email consent error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
