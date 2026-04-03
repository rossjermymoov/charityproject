import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "STAFF"]);

    // Get recent portal tokens with contact information
    const portalTokens = await prisma.memberPortalToken.findMany({
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formattedTokens = portalTokens.map((token) => ({
      id: token.id,
      contactId: token.contactId,
      token: token.token,
      portalUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/member-portal/${token.token}`,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
      contactName: `${token.contact.firstName} ${token.contact.lastName}`,
      contactEmail: token.contact.email,
    }));

    return NextResponse.json(formattedTokens);
  } catch (error) {
    console.error("Failed to fetch portal links:", error);
    return NextResponse.json(
      { error: "Failed to fetch portal links" },
      { status: 500 }
    );
  }
}
