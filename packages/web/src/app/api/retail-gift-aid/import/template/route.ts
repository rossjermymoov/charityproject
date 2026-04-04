import { NextResponse } from "next/server";

/**
 * Download a CSV template for retail gift aid imports.
 * GET /api/retail-gift-aid/import/template
 */
export async function GET() {
  const csv = `Donor Name,Sale Amount,Sale Date
John Smith,12.50,15/01/2026
Jane Doe,8.75,22/01/2026
Bob Wilson,25.00,03/02/2026
`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="retail-gift-aid-template.csv"',
    },
  });
}
