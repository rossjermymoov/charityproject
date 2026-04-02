import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import {
  levenshteinDistance,
  normalizePhone,
  normalizePostcode,
  normalizeName,
} from "@/lib/string-distance";

interface DuplicateGroup {
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  contacts: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    postcode: string | null;
    donationCount: number;
    lastDonationDate: string | null;
  }[];
}

interface DuplicateResult {
  duplicateGroups: DuplicateGroup[];
  totalContacts: number;
  potentialDuplicateCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    // Get pagination params
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = PAGE_SIZE;

    // Fetch all contacts with their related data
    const contacts = await prisma.contact.findMany({
      where: {
        isArchived: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        postcode: true,
        createdAt: true,
        donations: {
          select: {
            id: true,
            amount: true,
            date: true,
          },
          orderBy: {
            date: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalContacts = contacts.length;

    // Find duplicate groups
    const duplicateGroups: DuplicateGroup[] = [];
    const processedPairs = new Set<string>();

    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const contact1 = contacts[i];
        const contact2 = contacts[j];
        const pairKey1 = `${contact1.id}-${contact2.id}`;
        const pairKey2 = `${contact2.id}-${contact1.id}`;

        if (processedPairs.has(pairKey1) || processedPairs.has(pairKey2)) {
          continue;
        }

        const duplicateInfo = checkDuplicate(contact1, contact2);

        if (duplicateInfo) {
          processedPairs.add(pairKey1);
          duplicateGroups.push({
            confidence: duplicateInfo.confidence,
            reason: duplicateInfo.reason,
            contacts: [
              {
                id: contact1.id,
                firstName: contact1.firstName,
                lastName: contact1.lastName,
                email: contact1.email,
                phone: contact1.phone,
                postcode: contact1.postcode,
                donationCount: contact1.donations.length,
                lastDonationDate:
                  contact1.donations[0]?.date.toISOString().split("T")[0] ||
                  null,
              },
              {
                id: contact2.id,
                firstName: contact2.firstName,
                lastName: contact2.lastName,
                email: contact2.email,
                phone: contact2.phone,
                postcode: contact2.postcode,
                donationCount: contact2.donations.length,
                lastDonationDate:
                  contact2.donations[0]?.date.toISOString().split("T")[0] ||
                  null,
              },
            ],
          });
        }
      }
    }

    // Sort by confidence (HIGH first, then MEDIUM, then LOW)
    const confidenceOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    duplicateGroups.sort((a, b) => {
      return confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
    });

    // Paginate results
    const totalPages = Math.ceil(duplicateGroups.length / pageSize);
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedGroups = duplicateGroups.slice(startIdx, endIdx);

    return NextResponse.json({
      duplicateGroups: paginatedGroups,
      totalContacts,
      potentialDuplicateCount: duplicateGroups.length,
      page,
      pageSize,
      totalPages,
    } as DuplicateResult);
  } catch (error) {
    console.error("Error finding duplicates:", error);
    return NextResponse.json(
      { error: "Failed to find duplicate contacts" },
      { status: 500 }
    );
  }
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  postcode: string | null;
}

function checkDuplicate(
  contact1: Contact,
  contact2: Contact
): { confidence: "HIGH" | "MEDIUM" | "LOW"; reason: string } | null {
  // 1. Exact email match = HIGH confidence
  if (
    contact1.email &&
    contact2.email &&
    contact1.email.toLowerCase() === contact2.email.toLowerCase()
  ) {
    return {
      confidence: "HIGH",
      reason: "Same email address",
    };
  }

  // 2. Same first + last name = HIGH confidence
  const firstName1 = normalizeName(contact1.firstName);
  const firstName2 = normalizeName(contact2.firstName);
  const lastName1 = normalizeName(contact1.lastName);
  const lastName2 = normalizeName(contact2.lastName);

  if (firstName1 === firstName2 && lastName1 === lastName2) {
    return {
      confidence: "HIGH",
      reason: "Exact name match",
    };
  }

  // 3. Same phone number = MEDIUM confidence
  if (contact1.phone && contact2.phone) {
    const phone1 = normalizePhone(contact1.phone);
    const phone2 = normalizePhone(contact2.phone);

    if (phone1 && phone2 && phone1 === phone2) {
      return {
        confidence: "MEDIUM",
        reason: "Same phone number",
      };
    }
  }

  // 4. Similar name (edit distance <= 2) + same postcode = MEDIUM
  if (contact1.postcode && contact2.postcode) {
    const postcode1 = normalizePostcode(contact1.postcode);
    const postcode2 = normalizePostcode(contact2.postcode);

    if (postcode1 && postcode2 && postcode1 === postcode2) {
      const firstNameDistance = levenshteinDistance(firstName1, firstName2);
      const lastNameDistance = levenshteinDistance(lastName1, lastName2);

      if (firstNameDistance <= 2 && lastNameDistance <= 2) {
        return {
          confidence: "MEDIUM",
          reason:
            "Similar name + same postcode (edit distance ≤ 2 for each name)",
        };
      }
    }
  }

  // 5. Similar name (edit distance <= 3) alone = LOW confidence
  const firstNameDistance = levenshteinDistance(firstName1, firstName2);
  const lastNameDistance = levenshteinDistance(lastName1, lastName2);

  if (firstNameDistance <= 3 && lastNameDistance <= 3 && firstNameDistance + lastNameDistance <= 5) {
    // Also require email or phone to start with same letter to avoid false positives
    const firstNameMatch = firstName1[0] === firstName2[0];
    const lastNameMatch = lastName1[0] === lastName2[0];

    if (firstNameMatch && lastNameMatch) {
      return {
        confidence: "LOW",
        reason: `Similar name (first name distance: ${firstNameDistance}, last name distance: ${lastNameDistance})`,
      };
    }
  }

  return null;
}
