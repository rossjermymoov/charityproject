"use client";

import { formatDate, formatShortDate } from '@/lib/utils';

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ReportSection {
  title: string;
  data: Record<string, unknown>;
}

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
    sections?: ReportSection[];
    generatedAt?: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  REVIEWED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
};

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return value.toLocaleString();
    return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return String(value);
}

function RenderValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400">-</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-400">None</span>;

    // Render as table if items are objects
    if (typeof value[0] === "object" && value[0] !== null) {
      const keys = Object.keys(value[0] as Record<string, unknown>);
      return (
        <div className="overflow-x-auto mt-2">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-50">
                {keys.map((k) => (
                  <th key={k} className="px-3 py-2 text-left font-medium border-b">
                    {formatLabel(k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.map((item, idx) => {
                const row = item as Record<string, unknown>;
                return (
                  <tr key={idx} className="border-b">
                    {keys.map((k) => (
                      <td key={k} className="px-3 py-2">
                        {formatDisplayValue(row[k])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <ul className="list-disc list-inside">
        {value.map((item, idx) => (
          <li key={idx}>{formatDisplayValue(item)}</li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
        {entries.map(([k, v]) => (
          <div key={k} className="contents">
            <span className="text-gray-500 text-sm">{formatLabel(k)}:</span>
            <span className="text-sm font-medium">{formatDisplayValue(v)}</span>
          </div>
        ))}
      </div>
    );
  }

  return <span className="font-medium">{formatDisplayValue(value)}</span>;
}

export default function BoardReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [report, setReport] = useState<BoardReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [narrative, setNarrative] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/board-reports/${id}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data);
          setNarrative(data.narrative ?? "");
        }
      } catch (err) {
        console.error("Failed to load report:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSaveNarrative = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/board-reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narrative }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReport(updated);
      }
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      const res = await fetch(`/api/board-reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReport(updated);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading report...</div>;
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Report not found</p>
        <Link href="/reports/board">
          <Button>Back to Reports</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/reports/board" className="text-sm text-blue-600 hover:underline mb-2 block">
            ← Back to Board Reports
          </Link>
          <h1 className="text-2xl font-bold">{report.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={STATUS_COLORS[report.status] ?? "bg-gray-100"}>
              {report.status}
            </Badge>
            <span className="text-sm text-gray-500">
              Period: {report.period} | Generated: {formatDate(report.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {report.status === "DRAFT" && (
            <Button variant="outline" onClick={() => handleStatusChange("REVIEWED")}>
              Mark Reviewed
            </Button>
          )}
          {report.status === "REVIEWED" && (
            <Button onClick={() => handleStatusChange("APPROVED")}>
              Approve
            </Button>
          )}
          <a
            href={`/api/board-reports/${id}/export`}
            className="inline-flex items-center px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
          >
            Export Text
          </a>
          <a
            href={`/api/board-reports/${id}/export?format=csv`}
            className="inline-flex items-center px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
          >
            Export CSV
          </a>
        </div>
      </div>

      {/* Executive Summary */}
      {report.data?.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(report.data.summary).map(([key, value]) => (
                <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatDisplayValue(value)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{formatLabel(key)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Sections */}
      {report.data?.sections?.map((section, idx) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(section.data).map(([key, value]) => (
                <div key={key}>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">
                    {formatLabel(key)}
                  </h4>
                  <RenderValue value={value} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Narrative / Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Narrative & Notes</CardTitle>
          <CardDescription>
            Add commentary or context for board members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full border rounded-md p-3 min-h-[150px] text-sm"
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="Add narrative commentary, key highlights, or recommendations for the board..."
          />
          <div className="mt-3">
            <Button onClick={handleSaveNarrative} disabled={saving}>
              {saving ? "Saving..." : "Save Notes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
