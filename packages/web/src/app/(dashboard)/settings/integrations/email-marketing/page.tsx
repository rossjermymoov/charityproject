"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ChevronRight, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface EmailMarketingIntegration {
  id: string;
  provider: string;
  status: string;
  lastSyncAt: string | null;
  syncFrequency: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface SyncLog {
  id: string;
  direction: string;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

export default function EmailMarketingPage() {
  const [integrations, setIntegrations] = useState<EmailMarketingIntegration[]>([]);
  const [logs, setLogs] = useState<Record<string, SyncLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchIntegrations();
  }, []);

  async function fetchIntegrations() {
    try {
      const response = await fetch("/api/integrations/email-marketing");
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations);

        // Fetch logs for each integration
        for (const integration of data.integrations) {
          fetchLogs(integration.id);
        }
      }
    } catch (error) {
      console.error("Error fetching integrations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLogs(integrationId: string) {
    try {
      const response = await fetch(
        `/api/integrations/email-marketing/${integrationId}/logs?limit=5`
      );
      if (response.ok) {
        const data = await response.json();
        setLogs((prev) => ({
          ...prev,
          [integrationId]: data.logs,
        }));
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  }

  async function handleSync(integrationId: string, direction: string) {
    setSyncing((prev) => ({
      ...prev,
      [integrationId]: true,
    }));

    try {
      const response = await fetch(
        `/api/integrations/email-marketing/${integrationId}/sync`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direction }),
        }
      );

      if (response.ok) {
        await fetchLogs(integrationId);
        await fetchIntegrations();
      }
    } catch (error) {
      console.error("Error syncing:", error);
    } finally {
      setSyncing((prev) => ({
        ...prev,
        [integrationId]: false,
      }));
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "CONNECTED":
        return "bg-green-100 text-green-700";
      case "ERROR":
        return "bg-red-100 text-red-700";
      case "DISCONNECTED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return <div className="text-center py-12">Loading integrations...</div>;
  }

  return (
    <div className="space-y-8">
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
          <span>Email Marketing</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Email Marketing Integrations</h1>
        <p className="text-gray-500 mt-1">
          Sync contacts with Mailchimp and Dotdigital for two-way integration
        </p>
      </div>

      {/* Add New Integration */}
      <div className="flex gap-4">
        <Link
          href="/settings/integrations/email-marketing/new?provider=MAILCHIMP"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Mailchimp
        </Link>
        <Link
          href="/settings/integrations/email-marketing/new?provider=DOTDIGITAL"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Dotdigital
        </Link>
      </div>

      {/* Integrations List */}
      {integrations.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">
            No email marketing integrations configured yet. Add one to get started.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {integrations.map((integration) => {
            const integrationLogs = logs[integration.id] || [];

            return (
              <Card key={integration.id} className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {integration.provider === "MAILCHIMP" ? "Mailchimp" : "Dotdigital"}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-medium ${getStatusColor(
                            integration.status
                          )}`}
                        >
                          {integration.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Last synced: {formatDate(integration.lastSyncAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSync(integration.id, "PULL")}
                        disabled={syncing[integration.id]}
                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded"
                      >
                        {syncing[integration.id] ? "Syncing..." : "Sync from Provider"}
                      </button>
                      <Link
                        href={`/settings/integrations/email-marketing/${integration.id}/edit`}
                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="bg-gray-50 rounded p-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-gray-600 font-medium">Sync Frequency</div>
                        <div className="text-gray-900">{integration.syncFrequency}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 font-medium">Created</div>
                        <div className="text-gray-900">
                          {formatDate(integration.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Syncs */}
                  {integrationLogs.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-3">
                        Recent Sync Logs
                      </h4>
                      <div className="space-y-2">
                        {integrationLogs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded text-sm"
                          >
                            <div>
                              {log.status === "COMPLETED" && (
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                              )}
                              {log.status === "RUNNING" && (
                                <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                              )}
                              {log.status === "FAILED" && (
                                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {log.direction} - {log.status}
                              </div>
                              <div className="text-gray-600 text-xs mt-1">
                                {formatDate(log.startedAt)} •{" "}
                                {log.recordsProcessed} records
                                {log.recordsCreated > 0 &&
                                  ` • ${log.recordsCreated} created`}
                                {log.recordsUpdated > 0 &&
                                  ` • ${log.recordsUpdated} updated`}
                                {log.recordsFailed > 0 &&
                                  ` • ${log.recordsFailed} failed`}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
