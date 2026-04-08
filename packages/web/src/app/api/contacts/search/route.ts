import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "STAFF"]);

    const q = req.nextUrl.searchParams.get("q")?.trim() || "";

    if (!q || q.length < 1) {
      return NextResponse.json([]);
    }

    // Split search into terms for multi-word AND matching (e.g. "Jones SY10" = must match BOTH)
    const terms = q.split(/\s+/).filter(Boolean);

    // Each term must match at least one field (AND across terms, OR within each term's fields)
    const andConditions = terms.map((term) => {
      const termNum = parseInt(term, 10);
      const orFields: Record<string, unknown>[] = [
        { firstName: { contains: term, mode: "insensitive" as const } },
        { lastName: { contains: term, mode: "insensitive" as const } },
        { postcode: { contains: term, mode: "insensitive" as const } },
        { email: { contains: term, mode: "insensitive" as const } },
      ];
      if (!isNaN(termNum)) {
        orFields.push({ donorId: { equals: termNum } });
      }
      return { OR: orFields };
    });

    const whereClause = {
      isArchived: false,
      AND: andConditions,
    };

    const [contacts, totalCount] = await Promise.all([
      prisma.contact.findMany({
        where: whereClause,
        select: {
          id: true,
          donorId: true,
          firstName: true,
          lastName: true,
          email: true,
          addressLine1: true,
          city: true,
          postcode: true,
          giftAids: {
            where: { status: "ACTIVE" },
            select: { id: true },
            take: 1,
          },
        },
        take: 20,
        orderBy: { lastName: "asc" },
      }),
      prisma.contact.count({ where: whereClause }),
    ]);

    const results = contacts.map((c) => ({
      id: c.id,
      donorId: c.donorId,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email || "",
      addressLine1: c.addressLine1 || "",
      city: c.city || "",
      postcode: c.postcode || "",
      hasGiftAid: c.giftAids.length > 0,
    }));

    return NextResponse.json({ results, totalCount });
  } catch (error) {
    console.error("Failed to search contacts:", error);
    return NextResponse.json(
      { error: "Failed to search contacts" },
      { status: 500 }
    );
  }
}
