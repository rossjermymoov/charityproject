import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const report = await prisma.savedReport.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        description: true,
        entity: true,
        filters: true,
        columns: true,
        groupBy: true,
        sortBy: true,
        sortDir: true,
        isShared: true,
        lastRunAt: true,
        createdAt: true,
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Check authorization
    if (report.createdBy.id !== session.id && !report.isShared) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ownership
    const existingReport = await prisma.savedReport.findUnique({
      where: { id: params.id },
      select: { createdById: true },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (existingReport.createdById !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      description,
      filters,
      columns,
      groupBy,
      sortBy,
      sortDir,
      isShared,
      lastRunAt,
    } = body;

    const report = await prisma.savedReport.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(filters && { filters }),
        ...(columns && { columns }),
        ...(groupBy !== undefined && { groupBy }),
        ...(sortBy !== undefined && { sortBy }),
        ...(sortDir && { sortDir }),
        ...(isShared !== undefined && { isShared }),
        ...(lastRunAt && { lastRunAt: new Date(lastRunAt) }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        entity: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ownership
    const existingReport = await prisma.savedReport.findUnique({
      where: { id: params.id },
      select: { createdById: true },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (existingReport.createdById !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.savedReport.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}
