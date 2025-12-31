/**
 * Invitations Data Access Layer
 * Handles team member invitations with tenant isolation
 */
import { and, eq, desc, gt } from "drizzle-orm";
import { db } from "@/db";
import { invitations, users, type Invitation } from "@/db/schema";
import { type DALContext, validateContext } from "./context";
import { NotFoundError, ForbiddenError, DatabaseError, ValidationError } from "./errors";

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateInvitationInput {
  email: string;
  role: "admin" | "member";
}

export interface InvitationWithInviter extends Invitation {
  invitedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
}

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * List all invitations for the current tenant
 */
export async function listInvitations(ctx: DALContext): Promise<InvitationWithInviter[]> {
  validateContext(ctx);

  try {
    return await db.query.invitations.findMany({
      where: eq(invitations.tenantId, ctx.tenantId),
      orderBy: [desc(invitations.createdAt)],
      with: {
        invitedBy: {
          columns: { id: true, name: true, email: true },
        },
      },
    });
  } catch (error) {
    console.error("Failed to list invitations:", error);
    throw new DatabaseError("Failed to fetch invitations");
  }
}

/**
 * Get pending invitations for the current tenant
 */
export async function listPendingInvitations(ctx: DALContext): Promise<InvitationWithInviter[]> {
  validateContext(ctx);

  try {
    return await db.query.invitations.findMany({
      where: and(
        eq(invitations.tenantId, ctx.tenantId),
        eq(invitations.status, "pending"),
        gt(invitations.expiresAt, new Date())
      ),
      orderBy: [desc(invitations.createdAt)],
      with: {
        invitedBy: {
          columns: { id: true, name: true, email: true },
        },
      },
    });
  } catch (error) {
    console.error("Failed to list pending invitations:", error);
    throw new DatabaseError("Failed to fetch invitations");
  }
}

/**
 * Get invitation by token (for accepting invites - no auth required)
 */
export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  try {
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.token, token),
    });
    return invitation ?? null;
  } catch (error) {
    console.error("Failed to get invitation:", error);
    throw new DatabaseError("Failed to fetch invitation");
  }
}

/**
 * Check if email already has a pending invitation for tenant
 */
export async function hasPendingInvitation(ctx: DALContext, email: string): Promise<boolean> {
  validateContext(ctx);

  const existing = await db.query.invitations.findFirst({
    where: and(
      eq(invitations.tenantId, ctx.tenantId),
      eq(invitations.email, email.toLowerCase()),
      eq(invitations.status, "pending"),
      gt(invitations.expiresAt, new Date())
    ),
  });

  return !!existing;
}

/**
 * Check if email already exists as a user in tenant
 */
export async function isExistingUser(ctx: DALContext, email: string): Promise<boolean> {
  validateContext(ctx);

  const existing = await db.query.users.findFirst({
    where: and(
      eq(users.tenantId, ctx.tenantId),
      eq(users.email, email.toLowerCase())
    ),
  });

  return !!existing;
}

/**
 * Check if user can invite with the specified role
 * Owner can invite anyone, Admin can only invite members
 */
export function canInviteRole(
  inviterRole: "owner" | "admin" | "member",
  targetRole: "admin" | "member"
): boolean {
  if (inviterRole === "owner") return true;
  if (inviterRole === "admin" && targetRole === "member") return true;
  return false;
}

// ============================================================================
// MUTATION OPERATIONS
// ============================================================================

/**
 * Create a new invitation
 */
export async function createInvitation(
  ctx: DALContext,
  input: CreateInvitationInput,
  inviterRole: "owner" | "admin" | "member"
): Promise<Invitation> {
  validateContext(ctx);

  // Check role permission
  if (!canInviteRole(inviterRole, input.role)) {
    throw new ForbiddenError("You don't have permission to invite users with this role");
  }

  const email = input.email.toLowerCase();

  // Check if user already exists in tenant
  if (await isExistingUser(ctx, email)) {
    throw new ValidationError("User already exists in this organization", {
      email: ["This email is already a member of your organization"],
    });
  }

  // Check for existing pending invitation (allow re-invite if previous was revoked/expired)
  if (await hasPendingInvitation(ctx, email)) {
    throw new ValidationError("Invitation already sent", {
      email: ["An invitation has already been sent to this email"],
    });
  }

  // Generate secure token
  const token = crypto.randomUUID();
  
  // Set expiration to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  try {
    const [invitation] = await db
      .insert(invitations)
      .values({
        email,
        role: input.role,
        token,
        tenantId: ctx.tenantId,
        invitedById: ctx.userId,
        expiresAt,
      })
      .returning();

    return invitation;
  } catch (error) {
    console.error("Failed to create invitation:", error);
    throw new DatabaseError("Failed to create invitation");
  }
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(ctx: DALContext, id: string): Promise<void> {
  validateContext(ctx);

  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.id, id),
  });

  if (!invitation) {
    throw new NotFoundError("Invitation", id);
  }

  if (invitation.tenantId !== ctx.tenantId) {
    throw new ForbiddenError("Access denied to this invitation");
  }

  if (invitation.status !== "pending") {
    throw new ValidationError("Cannot revoke this invitation", {
      status: ["Only pending invitations can be revoked"],
    });
  }

  try {
    await db
      .update(invitations)
      .set({ status: "revoked" })
      .where(and(eq(invitations.id, id), eq(invitations.tenantId, ctx.tenantId)));
  } catch (error) {
    console.error("Failed to revoke invitation:", error);
    throw new DatabaseError("Failed to revoke invitation");
  }
}

/**
 * Accept an invitation and create user (called during signup)
 */
export async function acceptInvitation(
  token: string,
  userData: { name: string; passwordHash: string }
): Promise<{ invitation: Invitation; user: typeof users.$inferSelect }> {
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    throw new NotFoundError("Invitation");
  }

  if (invitation.status !== "pending") {
    throw new ValidationError("Invalid invitation", {
      token: ["This invitation is no longer valid"],
    });
  }

  if (invitation.expiresAt < new Date()) {
    // Mark as expired
    await db
      .update(invitations)
      .set({ status: "expired" })
      .where(eq(invitations.id, invitation.id));
    
    throw new ValidationError("Invitation expired", {
      token: ["This invitation has expired"],
    });
  }

  try {
    // Create user and update invitation in transaction
    const [user] = await db
      .insert(users)
      .values({
        email: invitation.email,
        name: userData.name,
        passwordHash: userData.passwordHash,
        role: invitation.role,
        tenantId: invitation.tenantId,
      })
      .returning();

    await db
      .update(invitations)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(invitations.id, invitation.id));

    return { invitation, user };
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    throw new DatabaseError("Failed to accept invitation");
  }
}


// ============================================================================
// TEAM MEMBERS
// ============================================================================

/**
 * List all users in the current tenant
 */
export async function listTeamMembers(ctx: DALContext) {
  validateContext(ctx);

  try {
    return await db.query.users.findMany({
      where: eq(users.tenantId, ctx.tenantId),
      orderBy: [desc(users.createdAt)],
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error("Failed to list team members:", error);
    throw new DatabaseError("Failed to fetch team members");
  }
}
