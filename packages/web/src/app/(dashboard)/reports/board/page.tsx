"use client";

import { formatDate, formatShortDate } from '@/lib/utils';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface BoardReport {
  id: string;
  title: string;
  type: string;
  period: string;
  startDate: string;
  endDate: string;
  status: string;
  narrative: string | null;
  createdAt: string;
  generatedBy: { id: string; name: string; email: string };
  data: {
    summary?: Record<string, unknown>;
    sections?: Array<{ title: string; data: Record<string, unknown> }>;
  };
}

const REPORT_TYPES = [
  { value: "QUARTERLY_SUMMARY", label: "Quarterly Summary" },
  { value: "ANNUAL_REVIEW", label: "Annual Review" },
  { value: "FUNDRAISING_UPDATE", label: "Fundraising Update" },
  { value: "MEMBERSHIP_REPORT", label: "Membership Report" },
  { value: "COMPLIANCE_REPORT", label: "Compliance Report" },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  REVIEWED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
};

const TYPE_LABELS: Record<string, string> = {
  QUARTERLY_SUMMARY: "Quarterly Summary",
  ANNUAL_REVIEW: "Annual Review",
  FUNDRAISING_UPDATE: "Fundraising Update",
  MEMBERSHIP_REPORT: "Membership Report",
  COMPLIANCE_REPORT: "Compliance Report",
  CUSTOM: "Custom",
};

export default function BoardReportsPage() {
  const [reports, setReports] = useState<BoardReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [formType, setFormType] = useState("QUARTERLY_SUMMARY");
  const [formPeriod, setFormPeriod] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");

  const loadReports = useCallback(async () => {
    try {
      const res = await fetch("/api/board-reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleGenerate = async () => {
    if (!formPeriod || !formStartDate || !formEndDate) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/board-reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          period: formPeriod,
          startDate: formStartDate,
          endDate: formEndDate,
        }),
      });
      if (res.ok) {
        setShowGenerator(false);
        setFormPeriod("");
        setFormStartDate("");
        setFormEndDate("");
        loadReports();
      }
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      await fetch(`/api/board-reports/${id}`, { method: "DELETE" });
      loadReports();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch(`/api/board-reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      loadReports();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const formatCurrency = (val: unknown): string => {
    if (typeof val !== "number") return "£0.00";
    return `£${val.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Board & Trustee Reports</h1>
          <p className="text-gray-500 mt-1">
            Generate and manage reports for board meetings
          </p>
        </div>
        <Button onClick={() => setShowGenerator(!showGenerator)}>
          {showGenerator ? "Cancel" : "Generate Report"}
        </Button>
      </div>

      {showGenerator && (
        <Card>
          <CardHeader>
            <CardTitle>Generate New Report</CardTitle>
            <CardDescription>
              Select a report type and date range to auto-generate a board report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Report Type
                </label>
                <Select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  options={REPORT_TYPES}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Period Label
                </label>
                <Input
                  placeholder='e.g. "Q1 2025" or "2024-25"'
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={handleGenerate}
                disabled={generating || !formPeriod || !formStartDate || !formEndDate}
              >
                {generating ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading reports...</div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No board reports generated yet</p>
              <Button onClick={() => setShowGenerator(true)}>
                Generate Your First Report
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent>
                <div className="flex items-start justify-between py-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/reports/board/${report.id}`}
                        className="text-lg font-semibold hover:text-blue-600"
                      >
                        {report.title}
                      </Link>
                      <Badge className={STATUS_COLORS[report.status] ?? "bg-gray-100"}>
                        {report.status}
                      </Badge>
                      <Badge variant="outline">
                        {TYPE_LABELS[report.type] ?? report.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Period: {report.period}</p>
                      <p>Generated by {report.generatedBy.name} on{" "}
                        {formatDate(report.createdAt)}</p>
                      {report.data?.summary && (
                        <p className="font-medium text-gray-700">
                          Total Income: {formatCurrency(report.data.summary.totalIncome ?? report.data.summary.totalRaised ?? 0)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.status === "DRAFT" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(report.id, "REVIEWED")}
                      >
                        Mark Reviewed
                      </Button>
                    )}
                    {report.status === "REVIEWED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(report.id, "APPROVED")}
                      >
                        Approve
                      </Button>
                    )}
                    <a
                      href={`/api/board-reports/${report.id}/export`}
                      className="inline-flex items-center px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
                    >
                      Export
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
