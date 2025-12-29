/**
 * Admin Session Data Access Layer
 * Handles session management for super admins
 */
import { db } from "@/db";
import { adminSessions, type AdminSession } from "@/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";
import crypto from "crypto";

const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export async function createSession(adminId: string): Promise<AdminSession> {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  const [session] = await db
    .insert(adminSessions)
    .values({
      adminId,
      token,
      expiresAt,
      lastActivityAt: now,
    })
    .returning();

  return session;
}

export async function validateSession(token: string): Promise<AdminSession | null> {
  const now = new Date();
  
  const session = await db.query.adminSessions.findFirst({
    where: and(
      eq(adminSessions.token, token),
      gt(adminSessions.expiresAt, now)
    ),
  });

  if (!session) return null;

  // Check inactivity timeout
  const inactivityThreshold = new Date(now.getTime() - INACTIVITY_TIMEOUT_MS);
  if (session.lastActivityAt < inactivityThreshold) {
    await deleteSession(token);
    return null;
  }

  return session;
}

export async function updateActivity(token: string): Promise<void> {
  const now = new Date();
  const newExpiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  await db
    .update(adminSessions)
    .set({
      lastActivityAt: now,
      expiresAt: newExpiresAt,
    })
    .where(eq(adminSessions.token, token));
}

export async function deleteSession(token: string): Promise<void> {
  await db
    .delete(adminSessions)
    .where(eq(adminSessions.token, token));
}

export async function deleteAllSessionsForAdmin(adminId: string): Promise<void> {
  await db
    .delete(adminSessions)
    .where(eq(adminSessions.adminId, adminId));
}

export async function cleanupExpiredSessions(): Promise<number> {
  const now = new Date();
  const result = await db
    .delete(adminSessions)
    .where(lt(adminSessions.expiresAt, now))
    .returning({ id: adminSessions.id });
  
  return result.length;
}
