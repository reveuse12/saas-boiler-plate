/**
 * Audit Log Data Access Layer
 * Records all administrative actions for security audit trail
 */
import { db } from "@/db";
import { auditLogs, type AuditLog } from "@/db/schema";
import { desc } from "drizzle-orm";

export type AuditAction =
  | "admin.login"
  | "admin.logout"
  | "admin.create"
  | "admin.delete"
  | "tenant.view"
  | "tenant.update"
  | "tenant.suspend"
  | "tenant.unsuspend"
  | "tenant.delete"
  | "user.view"
  | "user.reset_password";

export type TargetType = "tenant" | "user" | "admin" | null;

export interface CreateAuditLogInput {
  adminId: string;
  adminEmail: string;
  action: AuditAction;
  targetType?: TargetType;
  targetId?: string;
  details?: Record<string, unknown>;
}

export async function createLog(input: CreateAuditLogInput): Promise<AuditLog> {
  const [log] = await db
    .insert(auditLogs)
    .values({
      adminId: input.adminId,
      adminEmail: input.adminEmail,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      details: input.details ? JSON.stringify(input.details) : null,
    })
    .returning();

  return log;
}

export interface ListLogsOptions {
  limit?: number;
  offset?: number;
}

export async function listLogs(
  options: ListLogsOptions = {}
): Promise<{ logs: AuditLog[]; total: number }> {
  const { limit = 50, offset = 0 } = options;

  const logs = await db.query.auditLogs.findMany({
    orderBy: [desc(auditLogs.createdAt)],
    limit,
    offset,
  });

  const allLogs = await db.query.auditLogs.findMany();
  const total = allLogs.length;

  return { logs, total };
}

export function parseDetails(log: AuditLog): Record<string, unknown> | null {
  if (!log.details) return null;
  try {
    return JSON.parse(log.details) as Record<string, unknown>;
  } catch {
    return null;
  }
}
