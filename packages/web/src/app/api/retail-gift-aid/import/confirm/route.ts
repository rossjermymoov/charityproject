import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

interface MatchedDonation {
  rowNumber: number;
  firstName: string;
  lastName: string;
  amount: number;
  date: string; // ISO format YYYY-MM-DD
  rawName: string;
  matchedContactId: string;
  matchedContactName: string;
}

/**
 * Confirm and import matched retail gift aid donations.
 * POST /api/retail-gift-aid/import/confirm
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const donations: MatchedDonation[] = body.donations;

    if (!donations || !Array.isArray(donations) || donations.length === 0) {
      return NextResponse.json({ error: "No donations to import" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;

    for (const d of donations) {
      if (!d.matchedContactId || !d.amount || !d.date) {
        skipped++;
        continue;
      }

      try {
        const donationDate = new Date(d.date);

        // Check for duplicate (same contact, amount, date, retail)
        const existing = await prisma.donation.findFirst({
          where: {
            contactId: d.matchedContactId,
            amount: d.amount,
            date: donationDate,
            isRetail: true,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create the donation record
        await prisma.donation.create({
          data: {
            contactId: d.matchedContactId,
            amount: d.amount,
            currency: "GBP",
            type: "DONATION",
            method: "OTHER",
            reference: `EPOS Import - Row ${d.rowNumber}`,
            date: donationDate,
            isGiftAidable: true,
            giftAidClaimed: false,
            isRetail: true,
            notes: "Imported from EPOS CSV - Retail Gift Aid",
            status: "RECEIVED",
            createdById: session.id,
          },
        });

        imported++;
      } catch (error) {
        console.error(`Failed to import row ${d.rowNumber}:`, error);
        skipped++;
      }
    }

    await logAudit({
      userId: session.id,
      action: "CREATE",
      entityType: "Donation",
      entityId: "retail-csv-import",
      details: {
        action: "retail_gift_aid_csv_import",
        imported,
        skipped,
        totalRows: donations.length,
      },
    });

    return NextResponse.json({ imported, skipped });
  } catch (error) {
    console.error("Import confirm error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
