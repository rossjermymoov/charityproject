import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import {
  parseDonationCSV,
  validateDonationRow,
} from "@/lib/donation-csv-parser";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const imports = await prisma.donationImport.findMany({
      select: {
        id: true,
        filename: true,
        status: true,
        totalRows: true,
        processedRows: true,
        successRows: true,
        errorRows: true,
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
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(imports);
  } catch (error) {
    console.error("Error fetching donation imports:", error);
    return NextResponse.json(
      { error: "Failed to fetch donation imports" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a CSV file" },
        { status: 400 }
      );
    }

    // Read file content
    const csvContent = await file.text();

    // Parse CSV
    const { headers, rows, parseErrors } = parseDonationCSV(csvContent);

    if (parseErrors.length > 0) {
      return NextResponse.json(
        {
          error: "CSV parsing failed",
          details: parseErrors,
        },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "CSV file contains no data rows" },
        { status: 400 }
      );
    }

    // Create DonationImport record
    const donationImport = await prisma.donationImport.create({
      data: {
        filename: file.name,
        status: "PROCESSING",
        totalRows: rows.length,
        userId: session.id,
        errors: [],
      },
    });

    // Process rows asynchronously (background job simulation)
    processImportRows(donationImport.id, rows, session.id).catch((error) => {
      console.error("Error processing donation import:", error);
    });

    return NextResponse.json(donationImport, { status: 201 });
  } catch (error) {
    console.error("Error uploading donation CSV:", error);
    return NextResponse.json(
      { error: "Failed to process CSV upload" },
      { status: 500 }
    );
  }
}

async function processImportRows(
  importId: string,
  rows: Record<string, string>[],
  userId: string
) {
  const allErrors: Array<{
    row: number;
    field: string;
    message: string;
  }> = [];
  let successCount = 0;
  let processedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // +1 for header, +1 for 1-based indexing

    // Validate row
    const { valid, errors } = validateDonationRow(row, rowNumber);

    if (!valid) {
      allErrors.push(...errors);
      processedCount++;
      continue;
    }

    try {
      // Find or create contact
      let contact = await prisma.contact.findFirst({
        where: {
          email: {
            equals: row.contactEmail.toLowerCase(),
            mode: "insensitive" as const,
          },
        },
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            firstName: row.contactFirstName,
            lastName: row.contactLastName,
            email: row.contactEmail.toLowerCase(),
            createdById: userId,
          },
        });
      }

      // Find campaign if provided
      let campaignId: string | null = null;
      if (row.campaignName?.trim()) {
        const campaign = await prisma.campaign.findFirst({
          where: {
            name: {
              equals: row.campaignName,
              mode: "insensitive",
            },
          },
        });

        if (campaign) {
          campaignId = campaign.id;
        } else {
          allErrors.push({
            row: rowNumber,
            field: "campaignName",
            message: `Campaign "${row.campaignName}" not found`,
          });
        }
      }

      // Create donation
      await prisma.donation.create({
        data: {
          contactId: contact.id,
          amount: parseFloat(row.amount),
          date: new Date(row.date),
          method: row.method.toUpperCase(),
          reference: row.reference || null,
          notes: row.notes || null,
          giftAidClaimed: row.giftAid?.toLowerCase() === "true",
          isGiftAidable: row.giftAid?.toLowerCase() === "true",
          campaignId: campaignId || null,
          createdById: userId,
          type: "DONATION",
          status: "RECEIVED",
        },
      });

      successCount++;
      processedCount++;
    } catch (error) {
      allErrors.push({
        row: rowNumber,
        field: "donation",
        message: `Failed to create donation: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      processedCount++;
    }
  }

  // Update DonationImport record with results
  await prisma.donationImport.update({
    where: { id: importId },
    data: {
      status: "COMPLETED",
      processedRows: processedCount,
      successRows: successCount,
      errorRows: allErrors.length,
      errors: allErrors,
      completedAt: new Date(),
    },
  });
}
