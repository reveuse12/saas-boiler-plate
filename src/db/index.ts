/**
 * Database connection using Drizzle ORM
 * Supports both local PostgreSQL (pg) and Neon serverless
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Create the postgres client
const client = postgres(process.env.DATABASE_URL!);

// Create the Drizzle database instance with schema
export const db = drizzle(client, { schema });

// Export schema for use in queries
export { schema };

// Type helper for database instance
export type Database = typeof db;
