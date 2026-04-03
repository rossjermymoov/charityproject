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

    const fund = await prisma.fund.findUnique({
      where: { id: params.id },
      include: {
        transactions: {
          orderBy: { date: "desc" },
          take: 50,
        },
      },
    });

    if (!fund) {
      return NextResponse.json({ error: "Fund not found" }, { status: 404 });
    }

    return NextResponse.json(fund);
  } catch (error) {
    console.error("Error fetching fund:", error);
    return NextResponse.json(
      { error: "Failed to fetch fund" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    await requireAuth();

    const body = await req.json();

    const fund = await prisma.fund.update({
      where: { id: params.id },
      data: {
        name: body.name,
        type: body.type,
        description: body.description,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(fund);
  } catch (error) {
    console.error("Error updating fund:", error);
    return NextResponse.json(
      { error: "Failed to update fund" },
      { status: 500 }
    );
  }
}
