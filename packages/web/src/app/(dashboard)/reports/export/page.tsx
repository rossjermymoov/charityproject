"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, Loader2 } from "lucide-react";

type ExportType = "contacts" | "donations" | "memberships" | "events";

interface ExportFilters {
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
}

export default function ExportPage() {
  const [exportType, setExportType] = useState<ExportType>("contacts");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Shared filters
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  // Contact-specific filters
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Donation-specific filters
  const [donationType, setDonationType] = useState<string>("");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const filters: ExportFilters = {};

      // Add common filters
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      if (status) filters.status = status;

      // Add type-specific filters
      if (exportType === "contacts" && searchQuery) {
        filters.searchQuery = searchQuery;
      }

      if (exportType === "donations") {
        if (donationType) filters.type = donationType;
        if (minAmount) filters.minAmount = parseFloat(minAmount);
        if (maxAmount) filters.maxAmount = parseFloat(maxAmount);
      }

      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: exportType,
          filters,
          format: "csv",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Export failed");
      }

      // Handle file download
      const blob = await response.blob();
      const filename = `${exportType}_${new Date().toISOString().split("T")[0]}.csv`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Data Export</h1>
        <p className="text-gray-500 mt-2">
          Export any data type to CSV with optional filtering
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Type Selection */}
          <div className="space-y-2">
            <Select
              label="Data Type"
              value={exportType}
              onChange={(e) => setExportType(e.target.value as ExportType)}
              options={[
                { value: "contacts", label: "Contacts" },
                { value: "donations", label: "Donations" },
                { value: "memberships", label: "Memberships" },
                { value: "events", label: "Events" },
              ]}
            />
          </div>

          {/* Common filters: Date range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Date From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Date To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Common filter: Status */}
          <div className="space-y-2">
            {exportType === "contacts" && (
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="All statuses"
                options={[
                  { value: "", label: "All statuses" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "ARCHIVED", label: "Archived" },
                  { value: "DECEASED", label: "Deceased" },
                  { value: "ANONYMISED", label: "Anonymised" },
                ]}
              />
            )}
            {exportType === "donations" && (
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="All statuses"
                options={[
                  { value: "", label: "All statuses" },
                  { value: "RECEIVED", label: "Received" },
                  { value: "PENDING", label: "Pending" },
                  { value: "REFUNDED", label: "Refunded" },
                  { value: "CANCELLED", label: "Cancelled" },
                ]}
              />
            )}
            {exportType === "memberships" && (
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="All statuses"
                options={[
                  { value: "", label: "All statuses" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "EXPIRED", label: "Expired" },
                  { value: "CANCELLED", label: "Cancelled" },
                  { value: "PENDING", label: "Pending" },
                  { value: "LAPSED", label: "Lapsed" },
                ]}
              />
            )}
            {exportType === "events" && (
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="All statuses"
                options={[
                  { value: "", label: "All statuses" },
                  { value: "PLANNED", label: "Planned" },
                  { value: "OPEN", label: "Open" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "CANCELLED", label: "Cancelled" },
                ]}
              />
            )}
          </div>

          {/* Contact-specific filters */}
          {exportType === "contacts" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Search (Name/Email/Phone)</label>
              <Input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {/* Donation-specific filters */}
          {exportType === "donations" && (
            <>
              <Select
                label="Donation Type"
                value={donationType}
                onChange={(e) => setDonationType(e.target.value)}
                placeholder="All types"
                options={[
                  { value: "", label: "All types" },
                  { value: "DONATION", label: "Donation" },
                  { value: "PAYMENT", label: "Payment" },
                  { value: "GIFT", label: "Gift" },
                  { value: "EVENT_FEE", label: "Event Fee" },
                  { value: "SPONSORSHIP", label: "Sponsorship" },
                  { value: "LEGACY", label: "Legacy" },
                  { value: "GRANT", label: "Grant" },
                  { value: "IN_KIND", label: "In Kind" },
                ]}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Minimum Amount (£)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Maximum Amount (£)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="No limit"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
              Export completed successfully
            </div>
          )}

          {/* Export button */}
          <Button
            onClick={handleExport}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Maximum rows:</strong> Exports are limited to 10,000 rows per file.
          </p>
          <p>
            <strong>Contacts:</strong> Includes all contact details, preferences, and
            communication settings.
          </p>
          <p>
            <strong>Donations:</strong> Includes donor information, amounts, methods, and gift
            aid status.
          </p>
          <p>
            <strong>Memberships:</strong> Includes member details, membership type, dates, and
            renewal information.
          </p>
          <p>
            <strong>Events:</strong> Includes event details, status, capacity, and attendee
            counts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
