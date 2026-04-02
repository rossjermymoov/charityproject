"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SyncLog {
  id: string;
  entityType: string;
  entityId: string;
  xeroId: string | null;
  direction: string;
  status: string;
  detail: string | null;
  syncedAt: string;
}

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  SUCCESS: {
    bg: "bg-green-100",
    text: "text-green-800",
    icon: CheckCircle,
  },
  FAILED: {
    bg: "bg-red-100",
    text: "text-red-800",
    icon: AlertCircle,
  },
  PENDING: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    icon: Clock,
  },
  SKIPPED: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    icon: Clock,
  },
};

export default function SyncLogsPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const params = new URLSearchParams();
        if (entityTypeFilter) params.append("entityType", entityTypeFilter);
        if (statusFilter) params.append("status", statusFilter);

        const response = await fetch(`/api/integrations/xero/logs?${params}`);
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs);
        }
      } catch (err) {
        console.error("Failed to load sync logs:", err);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [entityTypeFilter, statusFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings" className="hover:text-gray-700">
            Settings
          </Link>
          <span>/</span>
          <Link href="/settings/integrations" className="hover:text-gray-700">
            Integrations
          </Link>
          <span>/</span>
          <Link href="/settings/integrations/xero" className="hover:text-gray-700">
            Xero
          </Link>
          <span>/</span>
          <span>Sync History</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/settings/integrations/xero"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sync History</h1>
            <p className="text-gray-500 mt-1">
              View all synced entities and their status
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entity Type
              </label>
              <select
                value={entityTypeFilter}
                onChange={(e) => {
                  setEntityTypeFilter(e.target.value);
                  setLoading(true);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="DONATION">Donations</option>
                <option value="CONTACT">Contacts</option>
                <option value="INVOICE">Invoices</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setLoading(true);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
                <option value="SKIPPED">Skipped</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-3">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : logs.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Entity ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Xero ID
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const StatusIcon =
                      statusColors[log.status as keyof typeof statusColors]?.icon ||
                      Clock;
                    const colors =
                      statusColors[log.status as keyof typeof statusColors] || {
                        bg: "bg-gray-100",
                        text: "text-gray-800",
                      };

                    return (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(log.syncedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900">{log.entityType}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-600">
                          {log.entityId.substring(0, 8)}...
                        </td>
                        <td className="py-3 px-4">
                          {log.xeroId ? (
                            <span className="font-mono text-xs text-gray-600">
                              {log.xeroId.substring(0, 8)}...
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${colors.bg}`}>
                            <StatusIcon className="h-3 w-3" />
                            <span className={`text-xs font-medium ${colors.text}`}>
                              {log.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {log.detail ? (
                            <span className="text-xs text-red-600" title={log.detail}>
                              {log.detail.substring(0, 50)}
                              {log.detail.length > 50 ? "..." : ""}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-gray-500">No sync logs found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
