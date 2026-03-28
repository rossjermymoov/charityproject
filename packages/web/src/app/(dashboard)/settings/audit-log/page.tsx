import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; action?: string }>;
}) {
  await requireAuth();

  const params = await searchParams;
  const entityTypeFilter = params.entityType || "";
  const actionFilter = params.action || "";

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      AND: [
        entityTypeFilter ? { entityType: entityTypeFilter } : {},
        actionFilter ? { action: actionFilter } : {},
      ],
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const actionColors: Record<string, string> = {
    CREATE: "bg-green-100 text-green-800",
    UPDATE: "bg-blue-100 text-blue-800",
    DELETE: "bg-red-100 text-red-800",
    ARCHIVE: "bg-orange-100 text-orange-800",
    LOGIN: "bg-indigo-100 text-indigo-800",
    LOGOUT: "bg-gray-100 text-gray-800",
    EXPORT: "bg-purple-100 text-purple-800",
    MERGE: "bg-cyan-100 text-cyan-800",
    ANONYMISE: "bg-pink-100 text-pink-800",
  };

  // Get unique entity types and actions for filters
  const [uniqueEntityTypes, uniqueActions] = await Promise.all([
    prisma.auditLog.findMany({
      select: { entityType: true },
      distinct: ["entityType"],
    }),
    prisma.auditLog.findMany({
      select: { action: true },
      distinct: ["action"],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-500 mt-1">
          Track all system activities and changes
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <form className="flex flex-col sm:flex-row gap-3">
          <select
            name="entityType"
            defaultValue={entityTypeFilter}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Entity Types</option>
            {uniqueEntityTypes.map((item) => (
              <option key={item.entityType} value={item.entityType}>
                {item.entityType}
              </option>
            ))}
          </select>

          <select
            name="action"
            defaultValue={actionFilter}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Actions</option>
            {uniqueActions.map((item) => (
              <option key={item.action} value={item.action}>
                {item.action}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Filter
          </button>
        </form>
      </Card>

      {/* Audit log table */}
      {auditLogs.length === 0 ? (
        <Card className="p-6">
          <div className="flex items-center justify-center gap-3 py-8">
            <Shield className="h-5 w-5 text-gray-400" />
            <p className="text-gray-500">No audit log entries found.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {log.user.name}
                        </p>
                        <p className="text-xs text-gray-500">{log.user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={actionColors[log.action] || ""}
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.entityType}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">
                      {log.entityId ? log.entityId.substring(0, 8) : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="truncate block max-w-xs" title={log.details || ""}>
                        {log.details
                          ? JSON.stringify(JSON.parse(log.details), null, 0).substring(0, 50)
                          : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Info note */}
      <Card className="p-4 bg-blue-50 border border-blue-100">
        <p className="text-sm text-blue-900">
          Showing the last 100 entries. Audit logs are immutable and retained according to your data retention policies.
        </p>
      </Card>
    </div>
  );
}
