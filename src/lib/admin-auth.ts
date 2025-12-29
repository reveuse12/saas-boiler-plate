/**
 * Admin Authentication Utilities
 * Provides helpers for super admin authentication and authorization
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { superAdminDAL, adminSessionDAL } from "@/lib/dal";
import type { SuperAdmin } from "@/db/schema";

const ADMIN_SESSION_COOKIE = "admin_session";

export interface AdminContext {
  admin: SuperAdmin;
  sessionToken: string;
}

export async function getAdminSession(): Promise<AdminContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) return null;

  const session = await adminSessionDAL.validateSession(token);
  if (!session) return null;

  const admin = await superAdminDAL.findById(session.adminId);
  if (!admin || !admin.isActive) return null;

  // Update session activity
  await adminSessionDAL.updateActivity(token);

  return { admin, sessionToken: token };
}

export async function requireAdmin(): Promise<AdminContext> {
  const context = await getAdminSession();
  if (!context) {
    redirect("/admin/login");
  }
  return context;
}

export async function requirePrimaryAdmin(): Promise<AdminContext> {
  const context = await requireAdmin();
  if (context.admin.role !== "primary_admin") {
    redirect("/admin/dashboard?error=forbidden");
  }
  return context;
}

export async function setAdminSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 60, // 30 minutes
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
