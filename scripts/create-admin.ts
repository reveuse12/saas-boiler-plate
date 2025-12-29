/**
 * CLI script to create the first super admin
 * Usage: npm run create-admin
 * 
 * Environment variables (set before running):
 * - ADMIN_EMAIL: Admin email address
 * - ADMIN_PASSWORD: Admin password (min 8 characters)
 * - ADMIN_NAME: Admin display name (optional)
 */
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env file manually BEFORE any other imports
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex);
          let value = trimmed.substring(eqIndex + 1);
          // Remove surrounding quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
    console.log("✓ Loaded .env file");
  } catch (err) {
    console.log("⚠ No .env file found, using existing environment variables");
  }
}

// Load env first
loadEnv();

// Now dynamically import the modules that depend on env vars
async function main() {
  const { db } = await import("../src/db");
  const { superAdmins } = await import("../src/db/schema");
  const bcrypt = await import("bcryptjs");

  const BCRYPT_COST = 12;

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Super Admin";

  if (!email || !password) {
    console.error("\nError: ADMIN_EMAIL and ADMIN_PASSWORD are required");
    console.log("\nUsage:");
    console.log("  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpassword npm run create-admin");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Error: Password must be at least 8 characters");
    process.exit(1);
  }

  try {
    // Check if admin already exists
    const existing = await db.query.superAdmins.findFirst();
    
    if (existing) {
      console.log("\nA super admin already exists. Use the admin panel to create additional admins.");
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    // Create primary admin
    const [admin] = await db
      .insert(superAdmins)
      .values({
        email: email.toLowerCase(),
        name,
        passwordHash,
        role: "primary_admin",
      })
      .returning();

    console.log("\n✅ Super admin created successfully!");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log("\nYou can now login at /admin/login");
  } catch (error) {
    console.error("Failed to create admin:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
