import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const stage = searchParams.get("stage");
    const assignedTo = searchParams.get("assignedTo");
    const campaignId = searchParams.get("campaignId");
    const search = searchParams.get("search");

    const where: any = {};
    if (stage) where.stage = stage;
    if (assignedTo) where.assignedToId = assignedTo;
    if (campaignId) where.campaignId = campaignId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contact: { firstName: { contains: search, mode: "insensitive" } } },
        { contact: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const opportunities = await prisma.donorOpportunity.findMany({
      where,
      include: {
        contact: true,
        campaign: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      contactId,
      name,
      description,
      stage = "IDENTIFICATION",
      amount = 0,
      probability = 10,
      expectedCloseDate,
      campaignId,
      assignedToId,
      notes,
    } = body;

    if (!contactId || !name) {
      return NextResponse.json(
        { error: "Contact and opportunity name are required" },
        { status: 400 }
      );
    }

    const opportunity = await prisma.donorOpportunity.create({
      data: {
        contactId,
        name,
        description,
        stage,
        amount: Number(amount),
        probability: Math.min(100, Math.max(0, Number(probability))),
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        campaignId: campaignId || null,
        assignedToId: assignedToId || null,
        notes,
        createdById: session.id,
        stageHistory: [
          {
            stage,
            timestamp: new Date().toISOString(),
            changedBy: session.name,
          },
        ],
      },
      include: {
        contact: true,
        campaign: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error("Error creating opportunity:", error);
    return NextResponse.json(
      { error: "Failed to create opportunity" },
      { status: 500 }
    );
  }
}
