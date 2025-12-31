/**
 * Super Admin Data Access Layer
 * Handles all super admin CRUD operations with security features
 */
import { db } from "@/db";
import { superAdmins, adminSetupTokens, type SuperAdmin } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const SETUP_TOKEN_EXPIRY_HOURS = 48;

export async function findByEmail(email: string): Promise<SuperAdmin | null> {
  const result = await db.query.superAdmins.findFirst({
    where: eq(superAdmins.email, email.toLowerCase()),
  });
  return result ?? null;
}

export async function findById(id: string): Promise<SuperAdmin | null> {
  const result = await db.query.superAdmins.findFirst({
    where: eq(superAdmins.id, id),
  });
  return result ?? null;
}

export async function listAll(): Promise<SuperAdmin[]> {
  return db.query.superAdmins.findMany({
    orderBy: (admins, { desc }) => [desc(admins.createdAt)],
  });
}

export async function create(data: {
  email: string;
  name: string;
  password?: string;
  role: "primary_admin" | "admin";
}): Promise<SuperAdmin> {
  const passwordHash = data.password 
    ? await bcrypt.hash(data.password, BCRYPT_COST)
    : null;
  
  const [admin] = await db
    .insert(superAdmins)
    .values({
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash,
      role: data.role,
    })
    .returning();
  
  return admin;
}

export async function verifyPassword(
  admin: SuperAdmin,
  password: string
): Promise<boolean> {
  if (!admin.passwordHash) return false;
  return bcrypt.compare(password, admin.passwordHash);
}

export async function isLocked(admin: SuperAdmin): Promise<boolean> {
  if (!admin.lockedUntil) return false;
  return new Date() < admin.lockedUntil;
}

export async function recordFailedLogin(adminId: string): Promise<void> {
  const admin = await findById(adminId);
  if (!admin) return;

  const newAttempts = admin.failedLoginAttempts + 1;
  const updates: Partial<SuperAdmin> = {
    failedLoginAttempts: newAttempts,
    updatedAt: new Date(),
  };

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
  }

  await db
    .update(superAdmins)
    .set(updates)
    .where(eq(superAdmins.id, adminId));
}

export async function recordSuccessfulLogin(adminId: string): Promise<void> {
  await db
    .update(superAdmins)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(superAdmins.id, adminId));
}

export async function updateAdmin(
  id: string,
  data: Partial<Pick<SuperAdmin, "name" | "email" | "isActive" | "role">>
): Promise<SuperAdmin | null> {
  const [updated] = await db
    .update(superAdmins)
    .set({
      ...data,
      email: data.email?.toLowerCase(),
      updatedAt: new Date(),
    })
    .where(eq(superAdmins.id, id))
    .returning();
  
  return updated ?? null;
}

export async function deleteAdmin(id: string): Promise<boolean> {
  const result = await db
    .delete(superAdmins)
    .where(eq(superAdmins.id, id))
    .returning({ id: superAdmins.id });
  
  return result.length > 0;
}

export async function countPrimaryAdmins(): Promise<number> {
  const result = await db.query.superAdmins.findMany({
    where: eq(superAdmins.role, "primary_admin"),
  });
  return result.length;
}

export async function changePassword(
  id: string,
  newPassword: string
): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  await db
    .update(superAdmins)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(superAdmins.id, id));
}


// ============================================================================
// SETUP TOKEN FUNCTIONS
// ============================================================================

/**
 * Create a setup token for a new admin to set their password
 */
export async function createSetupToken(adminId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + SETUP_TOKEN_EXPIRY_HOURS);

  await db.insert(adminSetupTokens).values({
    adminId,
    token,
    expiresAt,
  });

  return token;
}

/**
 * Get valid setup token with admin info
 */
export async function getValidSetupToken(token: string): Promise<{
  tokenId: string;
  adminId: string;
  admin: SuperAdmin;
} | null> {
  const result = await db.query.adminSetupTokens.findFirst({
    where: and(
      eq(adminSetupTokens.token, token),
      gt(adminSetupTokens.expiresAt, new Date())
    ),
    with: {
      admin: true,
    },
  });

  if (!result || result.usedAt) return null;

  return {
    tokenId: result.id,
    adminId: result.adminId,
    admin: result.admin,
  };
}

/**
 * Complete admin setup - set password and mark token as used
 */
export async function completeSetup(
  tokenId: string,
  adminId: string,
  password: string
): Promise<void> {
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  // Update admin with password
  await db
    .update(superAdmins)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(superAdmins.id, adminId));

  // Mark token as used
  await db
    .update(adminSetupTokens)
    .set({ usedAt: new Date() })
    .where(eq(adminSetupTokens.id, tokenId));
}

/**
 * Check if admin has completed setup (has password)
 */
export async function hasCompletedSetup(adminId: string): Promise<boolean> {
  const admin = await findById(adminId);
  return !!admin?.passwordHash;
}
