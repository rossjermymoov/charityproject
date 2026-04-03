import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id: pledgeId } = await params;
    const body = await req.json();

    const { amount, date, donationId, notes } = body;

    // Validate required fields
    if (!amount || !date) {
      return NextResponse.json(
        { error: "Missing required fields: amount, date" },
        { status: 400 }
      );
    }

    // Verify pledge exists
    const pledge = await prisma.pledge.findUnique({
      where: { id: pledgeId },
      include: { payments: true },
    });

    if (!pledge) {
      return NextResponse.json({ error: "Pledge not found" }, { status: 404 });
    }

    // Verify donation exists if provided
    if (donationId) {
      const donation = await prisma.donation.findUnique({
        where: { id: donationId },
      });

      if (!donation) {
        return NextResponse.json(
          { error: "Donation not found" },
          { status: 404 }
        );
      }
    }

    // Create payment record
    const payment = await prisma.pledgePayment.create({
      data: {
        pledgeId,
        donationId: donationId || null,
        amount: parseFloat(amount),
        date: new Date(date),
        notes: notes || null,
      },
    });

    // Update pledge's totalFulfilled
    const payments = await prisma.pledgePayment.findMany({
      where: { pledgeId },
    });

    const totalFulfilled = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Determine new status based on fulfilled amount
    let newStatus = pledge.status;
    if (totalFulfilled >= Number(pledge.amount)) {
      newStatus = "FULFILLED";
    } else if (totalFulfilled > 0) {
      newStatus = "PARTIALLY_FULFILLED";
    }

    await prisma.pledge.update({
      where: { id: pledgeId },
      data: {
        totalFulfilled: parseFloat(totalFulfilled.toString()),
        status: newStatus,
      },
    });

    const updatedPayment = await prisma.pledgePayment.findUnique({
      where: { id: payment.id },
      include: {
        pledge: true,
        donation: true,
      },
    });

    return NextResponse.json(updatedPayment, { status: 201 });
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id: pledgeId } = await params;

    const payments = await prisma.pledgePayment.findMany({
      where: { pledgeId },
      include: {
        donation: true,
      },
      orderBy: { date: "desc" },
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
