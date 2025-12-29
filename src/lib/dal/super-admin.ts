/**
 * Super Admin Data Access Layer
 * Handles all super admin CRUD operations with security features
 */
import { db } from "@/db";
import { superAdmins, type SuperAdmin, type NewSuperAdmin } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

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
  password: string;
  role: "primary_admin" | "admin";
}): Promise<SuperAdmin> {
  const passwordHash = await bcrypt.hash(data.password, BCRYPT_COST);
  
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
