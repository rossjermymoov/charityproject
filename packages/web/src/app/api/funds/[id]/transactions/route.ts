import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    await requireAuth();

    const transactions = await prisma.fundTransaction.findMany({
      where: { fundId: params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching fund transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch fund transactions" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await requireAuth();

    const body = await req.json();

    if (!body.type || !body.amount || !body.date) {
      return NextResponse.json(
        { error: "type, amount, and date are required" },
        { status: 400 }
      );
    }

    const fund = await prisma.fund.findUnique({
      where: { id: params.id },
    });

    if (!fund) {
      return NextResponse.json({ error: "Fund not found" }, { status: 404 });
    }

    // Calculate balance change based on transaction type
    let balanceChange = 0;
    if (body.type === "DEPOSIT" || body.type === "TRANSFER_IN") {
      balanceChange = body.amount;
    } else if (body.type === "WITHDRAWAL" || body.type === "TRANSFER_OUT") {
      balanceChange = -body.amount;
    } else if (body.type === "ADJUSTMENT") {
      balanceChange = body.amount;
    }

    // Create transaction and update fund balance atomically
    const transaction = await prisma.fundTransaction.create({
      data: {
        fundId: params.id,
        type: body.type,
        amount: body.amount,
        description: body.description || null,
        reference: body.reference || null,
        donationId: body.donationId || null,
        date: new Date(body.date),
        createdById: session.id,
      },
    });

    // Update fund balance
    await prisma.fund.update({
      where: { id: params.id },
      data: {
        balance: {
          increment: balanceChange,
        },
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating fund transaction:", error);
    return NextResponse.json(
      { error: "Failed to create fund transaction" },
      { status: 500 }
    );
  }
}
