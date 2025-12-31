/**
 * CLI script to reset super admin password
 * Usage: bun run reset-admin-password
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import * as readline from "readline";

// Load .env file manually BEFORE any other imports
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  
  for (const envFile of envFiles) {
    try {
      const envPath = resolve(process.cwd(), envFile);
      const envContent = readFileSync(envPath, "utf-8");
      for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const eqIndex = trimmed.indexOf("=");
          if (eqIndex > 0) {
            const key = trimmed.substring(0, eqIndex);
            let value = trimmed.substring(eqIndex + 1);
            if (
              (value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))
            ) {
              value = value.slice(1, -1);
            }
            process.env[key] = value;
          }
        }
      }
      console.log(`✓ Loaded ${envFile}`);
      return;
    } catch {
      // Try next file
    }
  }
  console.log("⚠ No .env or .env.local file found");
}

loadEnv();

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const { db } = await import("../src/db");
  const { superAdmins } = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");
  const bcrypt = await import("bcryptjs");

  const BCRYPT_COST = 12;

  try {
    // List all admins
    const admins = await db.query.superAdmins.findMany({
      columns: { id: true, email: true, name: true, role: true },
    });

    if (admins.length === 0) {
      console.log("\n❌ No super admins found. Run 'bun run create-admin' first.");
      process.exit(1);
    }

    console.log("\n🔐 Reset Super Admin Password\n");
    console.log("Available admins:");
    admins.forEach((admin, i) => {
      console.log(`  ${i + 1}. ${admin.email} (${admin.name}) - ${admin.role}`);
    });

    const selection = await prompt("\nSelect admin number: ");
    const index = parseInt(selection, 10) - 1;

    if (isNaN(index) || index < 0 || index >= admins.length) {
      console.error("\n❌ Invalid selection");
      process.exit(1);
    }

    const selectedAdmin = admins[index];
    console.log(`\nResetting password for: ${selectedAdmin.email}`);

    const password = await prompt("New password (min 8 chars): ");
    if (!password || password.length < 8) {
      console.error("\n❌ Password must be at least 8 characters");
      process.exit(1);
    }

    const confirmPassword = await prompt("Confirm password: ");
    if (password !== confirmPassword) {
      console.error("\n❌ Passwords do not match");
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    // Update password
    await db
      .update(superAdmins)
      .set({
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(superAdmins.id, selectedAdmin.id));

    console.log("\n✅ Password reset successfully!");
    console.log(`   Email: ${selectedAdmin.email}`);
    console.log("\n🚀 Login at: http://localhost:3000/admin/login\n");
  } catch (error) {
    console.error("\n❌ Failed to reset password:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
