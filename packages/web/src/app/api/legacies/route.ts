import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const legacy = await prisma.legacy.create({
      data: {
        deceasedName: body.deceasedName,
        contactId: body.contactId || null,
        type: body.type || "PECUNIARY",
        status: body.status || "NOTIFIED",
        estimatedAmount: body.estimatedAmount ? parseFloat(body.estimatedAmount) : null,
        receivedAmount: body.receivedAmount ? parseFloat(body.receivedAmount) : null,
        dateNotified: body.dateNotified ? new Date(body.dateNotified) : new Date(),
        dateOfDeath: body.dateOfDeath ? new Date(body.dateOfDeath) : null,
        probateGranted: body.probateGranted ? new Date(body.probateGranted) : null,
        dateReceived: body.dateReceived ? new Date(body.dateReceived) : null,
        executorName: body.executorName || null,
        executorEmail: body.executorEmail || null,
        executorPhone: body.executorPhone || null,
        solicitorName: body.solicitorName || null,
        solicitorFirm: body.solicitorFirm || null,
        solicitorEmail: body.solicitorEmail || null,
        solicitorPhone: body.solicitorPhone || null,
        willReference: body.willReference || null,
        description: body.description || null,
        conditions: body.conditions || null,
        notes: body.notes || null,
        createdById: session.id,
      },
    });

    return NextResponse.json(legacy, { status: 201 });
  } catch (error) {
    console.error("Create legacy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const legacies = await prisma.legacy.findMany({
      where: {
        AND: [
          status ? { status } : {},
          search
            ? {
                OR: [
                  { deceasedName: { contains: search, mode: "insensitive" } },
                  { solicitorName: { contains: search, mode: "insensitive" } },
                  { solicitorFirm: { contains: search, mode: "insensitive" } },
                  { contact: { firstName: { contains: search, mode: "insensitive" } } },
                  { contact: { lastName: { contains: search, mode: "insensitive" } } },
                ],
              }
            : {},
        ],
      },
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dateNotified: "desc" },
    });

    return NextResponse.json(legacies);
  } catch (error) {
    console.error("Get legacies error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
