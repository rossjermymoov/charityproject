import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import {
  exportContacts,
  exportDonations,
  exportMemberships,
  exportEvents,
} from "@/lib/data-export";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const body = await req.json();
    const { type, filters = {}, format = "csv" } = body;

    // Validate export type
    if (!["contacts", "donations", "memberships", "events"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid export type. Must be one of: contacts, donations, memberships, events" },
        { status: 400 }
      );
    }

    // Validate format
    if (format !== "csv") {
      return NextResponse.json(
        { error: "Only CSV format is currently supported" },
        { status: 400 }
      );
    }

    // Parse filter dates if they are strings
    const processedFilters: any = { ...filters };
    if (filters.dateFrom && typeof filters.dateFrom === "string") {
      processedFilters.dateFrom = new Date(filters.dateFrom);
    }
    if (filters.dateTo && typeof filters.dateTo === "string") {
      processedFilters.dateTo = new Date(filters.dateTo);
    }

    // Export based on type
    let csvContent: string;
    let filename: string;

    switch (type) {
      case "contacts":
        csvContent = await exportContacts(processedFilters);
        filename = `contacts_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      case "donations":
        csvContent = await exportDonations(processedFilters);
        filename = `donations_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      case "memberships":
        csvContent = await exportMemberships(processedFilters);
        filename = `memberships_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      case "events":
        csvContent = await exportEvents(processedFilters);
        filename = `events_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid export type" },
          { status: 400 }
        );
    }

    // Return CSV file as download
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Length": Buffer.byteLength(csvContent).toString(),
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
