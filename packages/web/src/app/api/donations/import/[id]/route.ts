import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, props: { params: Params }) {
  try {
    await requireAuth();
    const params = await props.params;

    const donationImport = await prisma.donationImport.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        filename: true,
        status: true,
        totalRows: true,
        processedRows: true,
        successRows: true,
        errorRows: true,
        errors: true,
        createdAt: true,
        completedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!donationImport) {
      return NextResponse.json(
        { error: "Import not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(donationImport);
  } catch (error) {
    console.error("Error fetching donation import:", error);
    return NextResponse.json(
      { error: "Failed to fetch donation import" },
      { status: 500 }
    );
  }
}
