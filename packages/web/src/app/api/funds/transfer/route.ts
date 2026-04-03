import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await req.json();

    if (!body.fromFundId || !body.toFundId || !body.amount) {
      return NextResponse.json(
        { error: "fromFundId, toFundId, and amount are required" },
        { status: 400 }
      );
    }

    if (body.fromFundId === body.toFundId) {
      return NextResponse.json(
        { error: "Cannot transfer to the same fund" },
        { status: 400 }
      );
    }

    // Verify both funds exist
    const [fromFund, toFund] = await Promise.all([
      prisma.fund.findUnique({ where: { id: body.fromFundId } }),
      prisma.fund.findUnique({ where: { id: body.toFundId } }),
    ]);

    if (!fromFund || !toFund) {
      return NextResponse.json(
        { error: "One or both funds not found" },
        { status: 404 }
      );
    }

    if (fromFund.balance < body.amount) {
      return NextResponse.json(
        { error: "Insufficient balance in source fund" },
        { status: 400 }
      );
    }

    // Create transfer record and update both fund balances
    const transfer = await prisma.fundTransfer.create({
      data: {
        fromFundId: body.fromFundId,
        toFundId: body.toFundId,
        amount: body.amount,
        reason: body.reason || null,
        approvedById: body.approvedById || null,
        date: new Date(body.date || new Date()),
      },
    });

    // Update fund balances
    await Promise.all([
      prisma.fund.update({
        where: { id: body.fromFundId },
        data: {
          balance: {
            decrement: body.amount,
          },
        },
      }),
      prisma.fund.update({
        where: { id: body.toFundId },
        data: {
          balance: {
            increment: body.amount,
          },
        },
      }),
    ]);

    // Create transactions for audit trail
    await Promise.all([
      prisma.fundTransaction.create({
        data: {
          fundId: body.fromFundId,
          type: "TRANSFER_OUT",
          amount: body.amount,
          description: `Transfer to ${toFund.name}`,
          date: transfer.date,
          createdById: session.id,
        },
      }),
      prisma.fundTransaction.create({
        data: {
          fundId: body.toFundId,
          type: "TRANSFER_IN",
          amount: body.amount,
          description: `Transfer from ${fromFund.name}`,
          date: transfer.date,
          createdById: session.id,
        },
      }),
    ]);

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error("Error creating fund transfer:", error);
    return NextResponse.json(
      { error: "Failed to create fund transfer" },
      { status: 500 }
    );
  }
}
