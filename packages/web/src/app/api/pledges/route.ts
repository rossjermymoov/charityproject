import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get("contactId");
    const status = searchParams.get("status");
    const overdue = searchParams.get("overdue") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {};

    if (contactId) {
      where.contactId = contactId;
    }

    if (status) {
      where.status = status;
    }

    if (overdue) {
      where.status = "OVERDUE";
    }

    const pledges = await prisma.pledge.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        campaign: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.pledge.count({ where });

    return NextResponse.json({
      pledges,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Pledge fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pledges" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      contactId,
      campaignId,
      amount,
      currency = "GBP",
      frequency = "ONE_TIME",
      startDate,
      endDate,
      reminderFrequency,
      notes,
    } = body;

    // Validate required fields
    if (!contactId || !amount || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields: contactId, amount, startDate" },
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

    // Verify campaign exists if provided
    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        );
      }
    }

    // Create pledge
    const pledge = await prisma.pledge.create({
      data: {
        contactId,
        campaignId: campaignId || null,
        amount: parseFloat(amount),
        currency,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        totalPledged: parseFloat(amount),
        reminderFrequency: reminderFrequency || null,
        notes: notes || null,
        createdById: session.id,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        campaign: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        payments: true,
      },
    });

    return NextResponse.json(pledge, { status: 201 });
  } catch (error) {
    console.error("Pledge creation error:", error);
    return NextResponse.json(
      { error: "Failed to create pledge" },
      { status: 500 }
    );
  }
}
