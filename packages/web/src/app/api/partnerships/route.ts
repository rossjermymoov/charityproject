import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Decimal } from "@prisma/client/runtime/library";

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

    const partnership = await prisma.corporatePartnership.create({
      data: {
        organisationId: body.organisationId,
        type: body.type || "PARTNER",
        status: body.status || "PROSPECT",
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        annualValue: body.annualValue ? new Decimal(body.annualValue) : null,
        totalValue: body.totalValue ? new Decimal(body.totalValue) : null,
        contactId: body.contactId || null,
        notes: body.notes || null,
        benefits: body.benefits || [],
        renewalDate: body.renewalDate ? new Date(body.renewalDate) : null,
      },
      include: {
        organisation: {
          select: { id: true, name: true },
        },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json(partnership, { status: 201 });
  } catch (error) {
    console.error("Create partnership error:", error);
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
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const partnerships = await prisma.corporatePartnership.findMany({
      where: {
        AND: [
          status ? { status } : {},
          type ? { type } : {},
          search
            ? {
                OR: [
                  { organisation: { name: { contains: search, mode: "insensitive" } } },
                  { contact: { firstName: { contains: search, mode: "insensitive" } } },
                  { contact: { lastName: { contains: search, mode: "insensitive" } } },
                  { contact: { email: { contains: search, mode: "insensitive" } } },
                  { notes: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      include: {
        organisation: {
          select: { id: true, name: true },
        },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(partnerships);
  } catch (error) {
    console.error("Get partnerships error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
