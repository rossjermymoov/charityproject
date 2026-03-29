import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      contactId,
      amount,
      currency = "GBP",
      type,
      method,
      status = "SUCCEEDED",
      description,
      providerId,
      externalId,
      paidAt,
    } = body;

    // Validate required fields
    if (!contactId || !amount || !type) {
      return NextResponse.json(
        { error: "Missing required fields: contactId, amount, type" },
        { status: 400 }
      );
    }

    // Verify contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        contactId,
        amount,
        currency,
        type,
        method: method || null,
        status,
        description: description || null,
        providerId: providerId || null,
        externalId: externalId || null,
        paidAt: paidAt ? new Date(paidAt) : null,
      },
      include: {
        contact: true,
        provider: true,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get("contactId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (contactId) {
      where.contactId = contactId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        contact: true,
        provider: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Payment fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
