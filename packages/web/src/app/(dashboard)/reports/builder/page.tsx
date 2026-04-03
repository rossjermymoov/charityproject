"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Using native <select> elements for compatibility
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Download,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Entity =
  | "CONTACTS"
  | "DONATIONS"
  | "EVENTS"
  | "CAMPAIGNS"
  | "VOLUNTEERS"
  | "MEMBERSHIPS";

interface Filter {
  field: string;
  operator: string;
  value: any;
}

interface ReportData {
  [key: string]: any;
}

const ENTITY_FIELDS: Record<Entity, string[]> = {
  CONTACTS: [
    "firstName",
    "lastName",
    "email",
    "phone",
    "postcode",
    "type",
    "status",
    "createdAt",
    "totalDonations",
    "donationCount",
    "lastDonationDate",
  ],
  DONATIONS: [
    "amount",
    "date",
    "type",
    "method",
    "contactName",
    "campaignName",
    "giftAidEligible",
    "giftAidClaimed",
  ],
  EVENTS: [
    "name",
    "type",
    "status",
    "startDate",
    "endDate",
    "attendeeCount",
    "totalIncome",
  ],
  CAMPAIGNS: [
    "name",
    "type",
    "status",
    "budgetTarget",
    "actualRaised",
    "startDate",
    "endDate",
    "progress",
  ],
  VOLUNTEERS: [
    "contactName",
    "status",
    "hoursLogged",
    "department",
    "skills",
  ],
  MEMBERSHIPS: [
    "contactName",
    "type",
    "status",
    "startDate",
    "expiryDate",
    "amount",
  ],
};

const OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  { value: "gt", label: "Greater Than" },
  { value: "gte", label: "Greater Than or Equal" },
  { value: "lt", label: "Less Than" },
  { value: "lte", label: "Less Than or Equal" },
  { value: "between", label: "Between" },
  { value: "in", label: "In List" },
  { value: "isNull", label: "Is Empty" },
  { value: "isNotNull", label: "Is Not Empty" },
];

const FIELD_LABELS: Record<string, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  email: "Email",
  phone: "Phone",
  postcode: "Postcode",
  type: "Type",
  status: "Status",
  createdAt: "Created Date",
  totalDonations: "Total Donations",
  donationCount: "Donation Count",
  lastDonationDate: "Last Donation Date",
  amount: "Amount",
  date: "Date",
  method: "Payment Method",
  contactName: "Contact Name",
  campaignName: "Campaign Name",
  giftAidEligible: "Gift Aid Eligible",
  giftAidClaimed: "Gift Aid Claimed",
  name: "Name",
  startDate: "Start Date",
  endDate: "End Date",
  attendeeCount: "Attendee Count",
  totalIncome: "Total Income",
  budgetTarget: "Budget Target",
  actualRaised: "Actual Raised",
  progress: "Progress %",
  hoursLogged: "Hours Logged",
  department: "Department",
  skills: "Skills",
  membershipType: "Membership Type",
  expiryDate: "Expiry Date",
};

export default function ReportBuilderPage() {
  const [entity, setEntity] = useState<Entity>("CONTACTS");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "firstName",
    "lastName",
    "email",
  ]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [groupBy, setGroupBy] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [data, setData] = useState<ReportData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [expandedFilters, setExpandedFilters] = useState(true);

  // Load saved reports
  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await fetch("/api/reports/saved");
        if (res.ok) {
          const reports = await res.json();
          setSavedReports(reports);
        }
      } catch (err) {
        console.error("Failed to load saved reports:", err);
      }
    };
    loadReports();
  }, []);

  const handleRunReport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reports/builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity,
          filters,
          columns: selectedColumns,
          groupBy: groupBy || undefined,
          sortBy: sortBy || undefined,
          sortDir,
          page,
          pageSize,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to run report");
      }

      const result = await res.json();
      setData(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!reportName.trim()) {
      setError("Report name is required");
      return;
    }

    try {
      const res = await fetch("/api/reports/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reportName,
          description: reportDescription,
          entity,
          filters,
          columns: selectedColumns,
          groupBy: groupBy || undefined,
          sortBy: sortBy || undefined,
          sortDir,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save report");
      }

      setShowSaveDialog(false);
      setReportName("");
      setReportDescription("");

      // Reload saved reports
      const reportsRes = await fetch("/api/reports/saved");
      if (reportsRes.ok) {
        setSavedReports(await reportsRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save report");
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity,
          filters,
          columns: selectedColumns,
          groupBy: groupBy || undefined,
          sortBy: sortBy || undefined,
          sortDir,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to export");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${entity.toLowerCase()}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  const handleLoadReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/saved/${reportId}`);
      if (!res.ok) throw new Error("Failed to load report");

      const report = await res.json();
      setEntity(report.entity);
      setSelectedColumns(report.columns);
      setFilters(report.filters);
      setGroupBy(report.groupBy || "");
      setSortBy(report.sortBy || "");
      setSortDir(report.sortDir || "asc");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    }
  };

  const addFilter = () => {
    setFilters([
      ...filters,
      { field: ENTITY_FIELDS[entity][0], operator: "equals", value: "" },
    ]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (
    index: number,
    field: keyof Filter,
    value: any
  ) => {
    const updated = [...filters];
    updated[index][field] = value;
    setFilters(updated);
  };

  const toggleColumn = (col: string) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const availableFields = ENTITY_FIELDS[entity];
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Report Builder</h1>
        <p className="text-gray-500 mt-2">
          Create custom reports by selecting entities, columns, and filters
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Entity Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Entity</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={entity}
                onChange={(e) => {
                  const v = e.target.value;
                  setEntity(v as Entity);
                  setSelectedColumns([ENTITY_FIELDS[v as Entity][0]]);
                  setFilters([]);
                }}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="CONTACTS">Contacts</option>
                <option value="DONATIONS">Donations</option>
                <option value="EVENTS">Events</option>
                <option value="CAMPAIGNS">Campaigns</option>
                <option value="VOLUNTEERS">Volunteers</option>
                <option value="MEMBERSHIPS">Memberships</option>
              </select>
            </CardContent>
          </Card>

          {/* Columns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Columns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availableFields.map((field) => (
                  <label key={field} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(field)}
                      onChange={() => toggleColumn(field)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {FIELD_LABELS[field] || field}
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sort */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sort</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose field...</option>
                {availableFields.map((field) => (
                  <option key={field} value={field}>
                    {FIELD_LABELS[field] || field}
                  </option>
                ))}
              </select>
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </CardContent>
          </Card>

          {/* Group By */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Group By (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None</option>
                {availableFields.map((field) => (
                  <option key={field} value={field}>
                    {FIELD_LABELS[field] || field}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
        </div>

        {/* Right Content - Filters and Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card>
            <div className="cursor-pointer px-6 py-4 border-b border-gray-100" onClick={() => setExpandedFilters(!expandedFilters)}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filters</h3>
                <div className="flex items-center gap-2">
                  {filters.length > 0 && (
                    <Badge variant="secondary">{filters.length}</Badge>
                  )}
                  {expandedFilters ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>
            </div>
            {expandedFilters && (
              <CardContent className="space-y-3">
                {filters.map((filter, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <select
                        value={filter.field}
                        onChange={(e) => updateFilter(idx, "field", e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {availableFields.map((field) => (
                          <option key={field} value={field}>
                            {FIELD_LABELS[field] || field}
                          </option>
                        ))}
                      </select>
                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(idx, "operator", e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {OPERATORS.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                      {!["isNull", "isNotNull"].includes(filter.operator) && (
                        <Input
                          placeholder="Value"
                          value={filter.value || ""}
                          onChange={(e) =>
                            updateFilter(idx, "value", e.target.value)
                          }
                        />
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeFilter(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addFilter}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Filter
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Saved Reports */}
          {savedReports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Saved Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {savedReports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => handleLoadReport(report.id)}
                      className="w-full text-left p-2 hover:bg-gray-100 rounded flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-sm">{report.name}</div>
                        <div className="text-xs text-gray-500">
                          {report.entity}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {report.createdBy?.name}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleRunReport}
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Run Report
            </Button>
            <Button
              onClick={() => setShowSaveDialog(true)}
              variant="outline"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              disabled={data.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Results */}
          {data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Results ({total} total)
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {selectedColumns.map((col) => (
                        <th
                          key={col}
                          className="text-left py-2 px-3 font-medium"
                        >
                          {FIELD_LABELS[col] || col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        {selectedColumns.map((col) => (
                          <td key={col} className="py-2 px-3">
                            {String(row[col] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(page - 1) * pageSize + 1} to{" "}
                    {Math.min(page * pageSize, total)} of {total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center">
                      <span className="text-sm">
                        Page {page} of {totalPages}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Save Report Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Save Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Report Name</label>
                <Input
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g., Monthly Donors"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Description (Optional)
                </label>
                <Input
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="What is this report for?"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveReport}
                  className="flex-1"
                >
                  Save Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
