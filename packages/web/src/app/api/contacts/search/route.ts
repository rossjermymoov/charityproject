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

    // Split search into terms for multi-word matching (e.g. "Mary Jones")
    const terms = q.split(/\s+/).filter(Boolean);

    // Build OR conditions: each term matches firstName, lastName, postcode, email
    const orConditions = terms.flatMap((term) => [
      { firstName: { contains: term, mode: "insensitive" as const } },
      { lastName: { contains: term, mode: "insensitive" as const } },
      { postcode: { contains: term, mode: "insensitive" as const } },
      { email: { contains: term, mode: "insensitive" as const } },
    ]);

    // Also try matching donorId as a number
    const donorIdNum = parseInt(q, 10);
    if (!isNaN(donorIdNum)) {
      orConditions.push({ donorId: { equals: donorIdNum } } as never);
    }

    const contacts = await prisma.contact.findMany({
      where: {
        isArchived: false,
        OR: orConditions,
      },
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
    });

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

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to search contacts:", error);
    return NextResponse.json(
      { error: "Failed to search contacts" },
      { status: 500 }
    );
  }
}
