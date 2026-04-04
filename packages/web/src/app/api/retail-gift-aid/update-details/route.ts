import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, firstName, lastName, addressLine1, addressLine2, city, postcode } = body;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
    }

    const notification = await prisma.retailGiftAidNotification.findUnique({
      where: { token },
      include: {
        claim: { select: { status: true } },
      },
    });

    if (!notification) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    // Can't update if claim already submitted
    if (["SUBMITTED", "ACCEPTED", "PARTIAL"].includes(notification.claim.status)) {
      return NextResponse.json(
        { error: "This claim has already been submitted. Please contact the charity." },
        { status: 400 }
      );
    }

    // Update the contact's details
    await prisma.contact.update({
      where: { id: notification.contactId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        addressLine1: addressLine1?.trim() || null,
        addressLine2: addressLine2?.trim() || null,
        city: city?.trim() || null,
        postcode: postcode?.trim() || null,
      },
    });

    // Update the notification record's contactName to reflect the new name
    const newName = `${firstName.trim()} ${lastName.trim()}`;
    await prisma.retailGiftAidNotification.update({
      where: { id: notification.id },
      data: { contactName: newName },
    });

    // Also update any claim items that reference this contact with the new name
    await prisma.giftAidClaimItem.updateMany({
      where: {
        claimId: notification.claimId,
        contactId: notification.contactId,
      },
      data: {
        donorName: newName,
        donorAddress: [addressLine1, city, postcode].filter(Boolean).join(", ") || null,
        donorPostcode: postcode?.trim() || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update details error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
