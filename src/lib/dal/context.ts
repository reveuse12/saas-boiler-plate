/**
 * DAL Context Management
 * Provides tenant-scoped context for all database operations
 */
import { UnauthorizedError } from "./errors";

/**
 * Context required for all tenant-scoped DAL operations
 */
export interface DALContext {
  tenantId: string;
  userId: string;
}

/**
 * Validates that a DAL context is present and valid
 * Throws UnauthorizedError if context is missing or invalid
 */
export function validateContext(ctx: DALContext | null | undefined): asserts ctx is DALContext {
  if (!ctx) {
    throw new UnauthorizedError("No session context provided");
  }

  if (!ctx.tenantId || typeof ctx.tenantId !== "string") {
    throw new UnauthorizedError("Invalid tenant context");
  }

  if (!ctx.userId || typeof ctx.userId !== "string") {
    throw new UnauthorizedError("Invalid user context");
  }
}

/**
 * Creates a DAL context from session data
 */
export function createContext(session: {
  user?: { id?: string; tenantId?: string };
} | null): DALContext {
  if (!session?.user?.id || !session?.user?.tenantId) {
    throw new UnauthorizedError("Session missing required user data");
  }

  return {
    tenantId: session.user.tenantId,
    userId: session.user.id,
  };
}
