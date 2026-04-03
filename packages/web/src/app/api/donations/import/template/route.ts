import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    // Create CSV template content
    const headers = [
      "contactEmail",
      "contactFirstName",
      "contactLastName",
      "amount",
      "date",
      "method",
      "source",
      "campaignName",
      "reference",
      "notes",
      "giftAid",
    ];

    const exampleRow = [
      "john.doe@example.com",
      "John",
      "Doe",
      "100.00",
      "2024-01-15",
      "CARD",
      "Online",
      "Annual Campaign 2024",
      "REF001",
      "Thank you letter sent",
      "true",
    ];

    const csvContent = `${headers.join(",")}\n${exampleRow.join(",")}`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="donation-import-template.csv"',
      },
    });
  } catch (error) {
    console.error("Error generating CSV template:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    );
  }
}
