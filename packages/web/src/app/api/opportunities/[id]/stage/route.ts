import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { stage, actualCloseDate, lostReason } = body;

    if (!stage) {
      return NextResponse.json(
        { error: "Stage is required" },
        { status: 400 }
      );
    }

    const opportunity = await prisma.donorOpportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    const stageHistory = Array.isArray(opportunity.stageHistory)
      ? opportunity.stageHistory
      : [];

    const newEntry = {
      stage,
      timestamp: new Date().toISOString(),
      changedBy: session.name,
      previousStage: opportunity.stage,
    };

    stageHistory.push(newEntry);

    const updateData: any = {
      stage,
      stageHistory,
    };

    if (actualCloseDate !== undefined) {
      updateData.actualCloseDate = actualCloseDate
        ? new Date(actualCloseDate)
        : null;
    }

    if (lostReason !== undefined && stage === "CLOSED_LOST") {
      updateData.lostReason = lostReason;
    }

    const updated = await prisma.donorOpportunity.update({
      where: { id },
      data: updateData,
      include: {
        contact: true,
        campaign: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating stage:", error);
    return NextResponse.json(
      { error: "Failed to update stage" },
      { status: 500 }
    );
  }
}
