import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiToken, unauthorizedResponse } from "@/lib/api-auth";

/**
 * GET /api/gasds/claims
 * List all GASDS claims, with optional filtering by tax year and status
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiToken(request);
    if (!auth) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const taxYear = searchParams.get("taxYear");
    const status = searchParams.get("status");

    const where: any = {};
    if (taxYear) where.taxYear = taxYear;
    if (status) where.status = status;

    const claims = await prisma.gasdsClaim.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        entries: { select: { id: true, amount: true, date: true, source: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(claims);
  } catch (error) {
    console.error("Error fetching GASDS claims:", error);
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}

/**
 * POST /api/gasds/claims
 * Create a new GASDS claim
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiToken(request);
    if (!auth) return unauthorizedResponse();

    const body = await request.json();
    const { taxYear, claimPeriodStart, claimPeriodEnd, notes } = body;

    if (!taxYear || !claimPeriodStart || !claimPeriodEnd) {
      return NextResponse.json(
        { error: "Missing required fields: taxYear, claimPeriodStart, claimPeriodEnd" },
        { status: 400 }
      );
    }

    const claim = await prisma.gasdsClaim.create({
      data: {
        taxYear,
        claimPeriodStart: new Date(claimPeriodStart),
        claimPeriodEnd: new Date(claimPeriodEnd),
        notes: notes || null,
        createdById: auth.userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        entries: true,
      },
    });

    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    console.error("Error creating GASDS claim:", error);
    return NextResponse.json({ error: "Failed to create claim" }, { status: 500 });
  }
}
