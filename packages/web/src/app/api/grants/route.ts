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

    const grant = await prisma.grant.create({
      data: {
        title: body.title,
        funderName: body.funderName,
        type: body.type || "TRUST",
        status: body.status || "IDENTIFIED",
        amountRequested: body.amountRequested ? parseFloat(body.amountRequested) : null,
        amountAwarded: body.amountAwarded ? parseFloat(body.amountAwarded) : null,
        applicationDeadline: body.applicationDeadline ? new Date(body.applicationDeadline) : null,
        submittedDate: body.submittedDate ? new Date(body.submittedDate) : null,
        decisionDate: body.decisionDate ? new Date(body.decisionDate) : null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        reportingDeadline: body.reportingDeadline ? new Date(body.reportingDeadline) : null,
        description: body.description || null,
        purpose: body.purpose || null,
        conditions: body.conditions || null,
        contactPerson: body.contactPerson || null,
        contactEmail: body.contactEmail || null,
        reference: body.reference || null,
        notes: body.notes || null,
        createdById: session.id,
      },
    });

    return NextResponse.json(grant, { status: 201 });
  } catch (error) {
    console.error("Create grant error:", error);
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

    const grants = await prisma.grant.findMany({
      where: {
        AND: [
          status ? { status } : {},
          search
            ? {
                OR: [
                  { title: { contains: search, mode: "insensitive" } },
                  { funderName: { contains: search, mode: "insensitive" } },
                  { reference: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
        funder: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(grants);
  } catch (error) {
    console.error("Get grants error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
