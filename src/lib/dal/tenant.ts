/**
 * Tenant Data Access Layer
 * Handles tenant lookup operations (not tenant-scoped, used by middleware)
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants, type Tenant, type NewTenant } from "@/db/schema";
import { NotFoundError, DatabaseError } from "./errors";

/**
 * Get tenant by slug (subdomain)
 * Used by middleware for tenant resolution
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const result = await db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
    });
    return result ?? null;
  } catch (error) {
    console.error("Failed to get tenant by slug:", error);
    throw new DatabaseError("Failed to lookup tenant");
  }
}

/**
 * Get tenant by ID
 */
export async function getTenantById(id: string): Promise<Tenant | null> {
  try {
    const result = await db.query.tenants.findFirst({
      where: eq(tenants.id, id),
    });
    return result ?? null;
  } catch (error) {
    console.error("Failed to get tenant by id:", error);
    throw new DatabaseError("Failed to lookup tenant");
  }
}

/**
 * Get tenant by ID or throw NotFoundError
 */
export async function getTenantByIdOrThrow(id: string): Promise<Tenant> {
  const tenant = await getTenantById(id);
  if (!tenant) {
    throw new NotFoundError("Tenant", id);
  }
  return tenant;
}

/**
 * Create a new tenant
 * Used during signup/onboarding
 */
export async function createTenant(data: NewTenant): Promise<Tenant> {
  try {
    const [tenant] = await db.insert(tenants).values(data).returning();
    return tenant;
  } catch (error) {
    console.error("Failed to create tenant:", error);
    throw new DatabaseError("Failed to create tenant");
  }
}

/**
 * Check if a slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existing = await getTenantBySlug(slug);
  return existing === null;
}
