import { prisma } from "@/lib/prisma";

type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "ARCHIVE"
  | "LOGIN"
  | "LOGOUT"
  | "EXPORT"
  | "MERGE"
  | "ANONYMISE";

interface AuditLogParams {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  details,
}: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId: entityId || null,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    // Never let audit logging break the main flow
    console.error("[audit] Failed to write audit log:", error);
  }
}
