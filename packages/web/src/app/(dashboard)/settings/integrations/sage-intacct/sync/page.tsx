import { formatDate, formatShortDate } from '@/lib/utils';
import { requireRole } from "@/lib/session";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Zap, Check, AlertTriangle, Clock } from "lucide-react";
import { triggerSync, getSageStats } from "../actions";

// ── Page ──────────────────────────────────────────────────────────

export default async function SyncDashboardPage() {
  const user = await requireRole(["ADMIN"]);

  const stats = await getSageStats();

  const recentLogs = await prisma.sageSyncLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return formatDate(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SYNCED":
        return <Check className="h-4 w-4 text-green-600" />;
      case "ERROR":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "SKIPPED":
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "SYNCED":
        return "default";
      case "ERROR":
        return "destructive";
      case "PENDING":
        return "secondary";
      case "SKIPPED":
        return "outline";
      default:
        return "secondary";
    }
  };

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
          <Link
            href="/settings/integrations/sage-intacct"
            className="hover:text-gray-700"
          >
            Sage Intacct
          </Link>
          <span>/</span>
          <span>Sync Dashboard</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/settings/integrations/sage-intacct"
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sync Dashboard
              </h1>
              <p className="text-gray-500 mt-1">
                Monitor sync status and view recent activity
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.totalSynced}
              </div>
              <p className="text-sm text-gray-600 mt-2">Synced</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">
                {stats.totalPending}
              </div>
              <p className="text-sm text-gray-600 mt-2">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {stats.totalErrors}
              </div>
              <p className="text-sm text-gray-600 mt-2">Errors</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-sm text-gray-600">Last Sync</div>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {stats.lastSyncTime
                  ? formatDate(stats.lastSyncTime)
                  : "Never"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Sync Control */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <form action={triggerSync} method="POST">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Trigger Manual Sync</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Start an immediate sync of unsynced donations and contacts to
                  Sage Intacct. This process runs asynchronously and may take
                  several minutes depending on volume.
                </p>
              </div>
              <div className="flex-shrink-0">
                <input type="hidden" name="syncType" value="DONATION" />
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 flex gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Sync Now
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recent Sync Logs */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Sync Logs
          </h2>

          {recentLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Entity Type
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Entity ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Sage Reference
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-700">
                          {log.entityType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {log.entityId.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant(log.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(log.status)}
                            {log.status}
                          </span>
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-gray-600">
                        {log.sageRef || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {log.status === "ERROR" && log.errorMessage ? (
                          <button className="text-xs text-red-600 hover:underline">
                            Show error
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No sync logs yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Sync logs will appear here when you trigger a manual sync or
                when automatic sync runs
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            Currently showing{" "}
            <strong>all recent syncs (last 50 entries)</strong>. TODO: Add status
            and entity type filters, export to CSV, and webhook status.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
