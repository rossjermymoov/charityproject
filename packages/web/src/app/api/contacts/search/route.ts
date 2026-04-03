import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "STAFF"]);

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q") || "";

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    // Search by name or email
    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      take: 20,
      orderBy: { lastName: "asc" },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Failed to search contacts:", error);
    return NextResponse.json(
      { error: "Failed to search contacts" },
      { status: 500 }
    );
  }
}
