import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const funds = await prisma.fund.findMany({
      include: {
        transactions: {
          take: 0,
        },
        transfersFrom: {
          take: 0,
        },
        transfersTo: {
          take: 0,
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(funds);
  } catch (error) {
    console.error("Error fetching funds:", error);
    return NextResponse.json(
      { error: "Failed to fetch funds" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const body = await req.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Fund name is required" },
        { status: 400 }
      );
    }

    const fund = await prisma.fund.create({
      data: {
        name: body.name,
        type: body.type || "UNRESTRICTED",
        description: body.description || null,
        isActive: body.isActive ?? true,
        balance: body.balance || 0,
      },
    });

    return NextResponse.json(fund, { status: 201 });
  } catch (error) {
    console.error("Error creating fund:", error);
    return NextResponse.json(
      { error: "Failed to create fund" },
      { status: 500 }
    );
  }
}
