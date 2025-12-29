/**
 * Type-safe environment variable access using Zod
 * Validates all required env vars at build/runtime
 */
import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Auth
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),

  // Multi-tenancy
  ROOT_DOMAIN: z.string().default("localhost:3000"),
  PROTOCOL: z.enum(["http", "https"]).default("http"),

  // Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

// Helper to check if we're in development
export const isDev = env.NODE_ENV === "development";

// Helper to check if we're running on localhost
export const isLocalhost = env.ROOT_DOMAIN.includes("localhost");

// Get the full base URL
export const getBaseUrl = () => `${env.PROTOCOL}://${env.ROOT_DOMAIN}`;

// Get tenant URL
export const getTenantUrl = (tenantSlug: string) => {
  if (isLocalhost) {
    // In development, use query param approach
    return `${getBaseUrl()}?tenant=${tenantSlug}`;
  }
  return `${env.PROTOCOL}://${tenantSlug}.${env.ROOT_DOMAIN}`;
};
