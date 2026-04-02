import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiToken, unauthorizedResponse } from "@/lib/api-auth";

/**
 * GET /api/gasds/claims/[id]
 * Get a specific GASDS claim with all its entries
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyApiToken(request);
    if (!auth) return unauthorizedResponse();

    const claim = await prisma.gasdsClaim.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        entries: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    return NextResponse.json(claim);
  } catch (error) {
    console.error("Error fetching GASDS claim:", error);
    return NextResponse.json({ error: "Failed to fetch claim" }, { status: 500 });
  }
}

/**
 * PUT /api/gasds/claims/[id]
 * Update a GASDS claim
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyApiToken(request);
    if (!auth) return unauthorizedResponse();

    const body = await request.json();
    const { status, notes, hmrcReference, submittedAt, responseAt } = body;

    // Verify claim exists
    const existingClaim = await prisma.gasdsClaim.findUnique({
      where: { id: params.id },
    });

    if (!existingClaim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Only allow DRAFT claims to be modified (except status updates)
    if (existingClaim.status !== "DRAFT" && status !== existingClaim.status) {
      return NextResponse.json(
        { error: "Can only modify draft claims" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (hmrcReference !== undefined) updateData.hmrcReference = hmrcReference;
    if (submittedAt !== undefined) updateData.submittedAt = submittedAt ? new Date(submittedAt) : null;
    if (responseAt !== undefined) updateData.responseAt = responseAt ? new Date(responseAt) : null;

    const updated = await prisma.gasdsClaim.update({
      where: { id: params.id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        entries: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating GASDS claim:", error);
    return NextResponse.json({ error: "Failed to update claim" }, { status: 500 });
  }
}

/**
 * DELETE /api/gasds/claims/[id]
 * Delete a GASDS claim (only DRAFT claims)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyApiToken(request);
    if (!auth) return unauthorizedResponse();

    const claim = await prisma.gasdsClaim.findUnique({
      where: { id: params.id },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (claim.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Can only delete draft claims" },
        { status: 403 }
      );
    }

    await prisma.gasdsClaim.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting GASDS claim:", error);
    return NextResponse.json({ error: "Failed to delete claim" }, { status: 500 });
  }
}
