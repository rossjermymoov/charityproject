import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await prisma.savedReport.findMany({
      where: {
        OR: [
          { createdById: session.id },
          { isShared: true },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        entity: true,
        lastRunAt: true,
        isShared: true,
        createdAt: true,
        createdBy: {
          select: { name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching saved reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved reports" },
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
      name,
      description,
      entity,
      filters,
      columns,
      groupBy,
      sortBy,
      sortDir,
      isShared,
    } = body;

    if (!name || !entity) {
      return NextResponse.json(
        { error: "Name and entity are required" },
        { status: 400 }
      );
    }

    const report = await prisma.savedReport.create({
      data: {
        name,
        description: description || null,
        entity,
        filters: filters || [],
        columns: columns || [],
        groupBy: groupBy || null,
        sortBy: sortBy || null,
        sortDir: sortDir || "asc",
        isShared: isShared || false,
        createdById: session.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        entity: true,
        createdAt: true,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error saving report:", error);
    return NextResponse.json(
      { error: "Failed to save report" },
      { status: 500 }
    );
  }
}
