"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreVertical,
  Trash2,
  Edit2,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface SavedReport {
  id: string;
  name: string;
  description: string | null;
  entity: string;
  lastRunAt: string | null;
  isShared: boolean;
  createdAt: string;
  createdBy: {
    name: string;
  };
}

export function SavedReportsList({ userId }: { userId: string }) {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/reports/saved");
        if (res.ok) {
          const data = await res.json();
          setReports(data);
        }
      } catch (err) {
        console.error("Failed to load saved reports:", err);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this report?")) {
      return;
    }

    setDeleting(id);
    try {
      const res = await fetch(`/api/reports/saved/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setReports(reports.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete report:", err);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500 mb-4">No saved reports yet</p>
          <Link href="/reports/builder">
            <Button size="sm">Create Your First Report</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const entityBadgeColor: Record<string, string> = {
    CONTACTS: "bg-blue-100 text-blue-800",
    DONATIONS: "bg-green-100 text-green-800",
    EVENTS: "bg-purple-100 text-purple-800",
    CAMPAIGNS: "bg-orange-100 text-orange-800",
    VOLUNTEERS: "bg-indigo-100 text-indigo-800",
    MEMBERSHIPS: "bg-pink-100 text-pink-800",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-gray-900">{report.name}</h3>
                  <Badge
                    className={
                      entityBadgeColor[report.entity] ||
                      "bg-gray-100 text-gray-800"
                    }
                    variant="outline"
                  >
                    {report.entity}
                  </Badge>
                  {report.isShared && (
                    <Badge variant="secondary">Shared</Badge>
                  )}
                </div>
                {report.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {report.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Created by {report.createdBy.name}</span>
                  {report.lastRunAt && (
                    <span>
                      Last run:{" "}
                      {new Date(report.lastRunAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Link href={`/reports/builder?reportId=${report.id}`}>
                  <Button size="sm" variant="ghost">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </Link>
                <button
                  onClick={() => handleDelete(report.id)}
                  disabled={deleting === report.id}
                  className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"
                >
                  {deleting === report.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-red-500" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
