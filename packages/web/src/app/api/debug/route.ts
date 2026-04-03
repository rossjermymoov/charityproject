import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: "cmndbyv0a0007ll3mgn2jyow4" },
      include: {
        organisation: true,
        tags: { include: { tag: true } },
        notes: { include: { createdBy: true }, orderBy: { createdAt: "desc" } },
        interactions: { include: { createdBy: true }, orderBy: { date: "desc" } },
        volunteerProfile: true,
        giftAids: { orderBy: { createdAt: "desc" }, take: 5 },
        donations: { include: { campaign: true }, orderBy: { date: "desc" }, take: 5 },
        eventAttendees: { include: { event: true }, orderBy: { createdAt: "desc" }, take: 5 },
        eventOrders: { include: { event: true, lineItems: { include: { item: true } } }, orderBy: { createdAt: "desc" }, take: 5 },
        fundraisingPages: {
          include: {
            event: true,
            donations: { orderBy: { donationDate: "desc" }, take: 10 },
          },
          orderBy: { createdAt: "desc" },
        },
        relationshipsFrom: { include: { toContact: true } },
        relationshipsTo: { include: { fromContact: true } },
      },
    });
    return NextResponse.json({ success: true, contactName: contact?.firstName + " " + contact?.lastName, keys: contact ? Object.keys(contact) : [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ success: false, error: message, stack }, { status: 500 });
  }
}
