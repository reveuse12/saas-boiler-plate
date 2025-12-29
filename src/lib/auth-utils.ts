/**
 * Auth utilities for server components and actions
 */
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { createContext, type DALContext } from "./dal/context";

/**
 * Get the current session or redirect to login
 * Use in server components that require authentication
 */
export async function getRequiredSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

/**
 * Get the current session (may be null)
 * Use when authentication is optional
 */
export async function getOptionalSession() {
  return await auth();
}

/**
 * Get DAL context from the current session
 * Throws if not authenticated
 */
export async function getDALContext(): Promise<DALContext> {
  const session = await getRequiredSession();
  return createContext(session);
}

/**
 * Check if user has required role
 */
export function hasRole(
  session: { user: { role: string } },
  requiredRoles: string[]
): boolean {
  return requiredRoles.includes(session.user.role);
}

/**
 * Require specific role or redirect
 */
export async function requireRole(requiredRoles: string[]) {
  const session = await getRequiredSession();

  if (!hasRole(session, requiredRoles)) {
    redirect("/unauthorized");
  }

  return session;
}
