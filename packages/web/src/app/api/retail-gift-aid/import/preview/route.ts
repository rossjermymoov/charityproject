import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

interface DonationInput {
  rowNumber: number;
  firstName: string;
  lastName: string;
  amount: number;
  date: string;
  rawName: string;
}

/**
 * Preview CSV import: match donor names to contacts in the CRM.
 * POST /api/retail-gift-aid/import/preview
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const donations: DonationInput[] = body.donations;

    if (!donations || !Array.isArray(donations) || donations.length === 0) {
      return NextResponse.json({ error: "No donations provided" }, { status: 400 });
    }

    // Get all contacts with active RETAIL gift aid declarations
    const retailDeclarations = await prisma.giftAid.findMany({
      where: {
        status: "ACTIVE",
        type: "RETAIL",
      },
      select: { contactId: true },
    });

    const retailContactIds = new Set(retailDeclarations.map((d) => d.contactId));

    // Get all contacts (we'll match by name)
    const allContacts = await prisma.contact.findMany({
      where: {
        id: { in: Array.from(retailContactIds) },
        status: "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    // Build name lookup (lowercase "firstname lastname" -> contact)
    const nameMap = new Map<string, typeof allContacts>();
    for (const contact of allContacts) {
      const key = `${contact.firstName.toLowerCase()} ${contact.lastName.toLowerCase()}`.trim();
      if (!nameMap.has(key)) nameMap.set(key, []);
      nameMap.get(key)!.push(contact);
    }

    let matched = 0;
    let unmatched = 0;
    let errors = 0;
    let totalAmount = 0;

    const results = donations.map((d) => {
      // Validate amount
      if (isNaN(d.amount) || d.amount <= 0) {
        errors++;
        return {
          ...d,
          matchedContactId: null,
          matchedContactName: null,
          matchStatus: "error" as const,
          error: "Invalid amount",
        };
      }

      // Validate date
      const parsedDate = parseDate(d.date);
      if (!parsedDate) {
        errors++;
        return {
          ...d,
          matchedContactId: null,
          matchedContactName: null,
          matchStatus: "error" as const,
          error: "Invalid date format",
        };
      }

      // Try to match by name
      const searchKey = `${d.firstName.toLowerCase()} ${d.lastName.toLowerCase()}`.trim();
      const matches = nameMap.get(searchKey);

      if (!matches || matches.length === 0) {
        unmatched++;
        return {
          ...d,
          date: parsedDate.toISOString().split("T")[0],
          matchedContactId: null,
          matchedContactName: null,
          matchStatus: "unmatched" as const,
        };
      }

      if (matches.length > 1) {
        unmatched++;
        return {
          ...d,
          date: parsedDate.toISOString().split("T")[0],
          matchedContactId: null,
          matchedContactName: null,
          matchStatus: "multiple" as const,
          error: `Multiple contacts match: ${matches.map((m) => `${m.firstName} ${m.lastName}`).join(", ")}`,
        };
      }

      const contact = matches[0];
      matched++;
      totalAmount += d.amount;

      return {
        ...d,
        date: parsedDate.toISOString().split("T")[0],
        matchedContactId: contact.id,
        matchedContactName: `${contact.firstName} ${contact.lastName}`,
        matchStatus: "matched" as const,
      };
    });

    return NextResponse.json({
      donations: results,
      matched,
      unmatched,
      errors,
      totalAmount,
    });
  } catch (error) {
    console.error("Preview import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try DD/MM/YYYY
  const ukMatch = dateStr.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (ukMatch) {
    const d = new Date(parseInt(ukMatch[3]), parseInt(ukMatch[2]) - 1, parseInt(ukMatch[1]));
    if (!isNaN(d.getTime())) return d;
  }

  // Try YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const d = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    if (!isNaN(d.getTime())) return d;
  }

  // Try generic Date parse
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  return null;
}
