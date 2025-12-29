/**
 * Tenant validation schemas
 */
import { z } from "zod";

// Slug validation - alphanumeric, lowercase, hyphens allowed
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const tenantSlugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(63, "Slug must be at most 63 characters")
  .regex(slugRegex, "Slug must be lowercase alphanumeric with hyphens");

export const createTenantSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  slug: tenantSlugSchema,
  plan: z.enum(["free", "pro", "enterprise"]).default("free"),
});

export const updateTenantSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  plan: z.enum(["free", "pro", "enterprise"]).optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
