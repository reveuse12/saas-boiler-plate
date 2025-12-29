/**
 * Password Reset Token Data Access Layer
 * Handles token generation, validation, and invalidation
 */
import { eq, and, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, users, tenants } from "@/db/schema";
import { createHash, randomBytes } from "crypto";

const TOKEN_EXPIRY_HOURS = 1;

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hash a token for secure storage
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Create a password reset token for a user
 * Returns the raw token (to be sent to user) or null if user not found
 */
export async function createPasswordResetToken(
  email: string,
  tenantSlug: string
): Promise<string | null> {
  // Find tenant by slug
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.slug, tenantSlug),
  });

  if (!tenant) {
    return null;
  }

  // Find user by email within tenant
  const user = await db.query.users.findFirst({
    where: and(eq(users.email, email), eq(users.tenantId, tenant.id)),
  });

  if (!user) {
    return null;
  }

  // Generate token
  const rawToken = generateToken();
  const hashedToken = hashToken(rawToken);

  // Calculate expiration (1 hour from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

  // Invalidate any existing tokens for this user
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt)
      )
    );

  // Create new token
  await db.insert(passwordResetTokens).values({
    token: hashedToken,
    userId: user.id,
    tenantId: tenant.id,
    expiresAt,
  });

  return rawToken;
}


/**
 * Validate a password reset token
 * Returns user info if valid, null otherwise
 */
export async function getValidToken(rawToken: string): Promise<{
  userId: string;
  tenantId: string;
  tokenId: string;
} | null> {
  const hashedToken = hashToken(rawToken);

  const token = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.token, hashedToken),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, new Date())
    ),
  });

  if (!token) {
    return null;
  }

  return {
    userId: token.userId,
    tenantId: token.tenantId,
    tokenId: token.id,
  };
}

/**
 * Invalidate a password reset token (mark as used)
 */
export async function invalidateToken(tokenId: string): Promise<void> {
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, tokenId));
}

/**
 * Create a password reset token for a user by ID
 * Returns the raw token (to be sent to user)
 */
export async function createToken(
  userId: string,
  tenantId: string
): Promise<{ token: string }> {
  // Generate token
  const rawToken = generateToken();
  const hashedToken = hashToken(rawToken);

  // Calculate expiration (1 hour from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

  // Invalidate any existing tokens for this user
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        isNull(passwordResetTokens.usedAt)
      )
    );

  // Create new token
  await db.insert(passwordResetTokens).values({
    token: hashedToken,
    userId,
    tenantId,
    expiresAt,
  });

  return { token: rawToken };
}

/**
 * Get token expiry time in hours
 */
export function getTokenExpiryHours(): number {
  return TOKEN_EXPIRY_HOURS;
}
