/**
 * CLI script to create the first super admin
 * Usage: bun run create-admin
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import * as readline from "readline";

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
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
  } catch (err) {
    console.log("⚠ No .env file found");
  }
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
  const bcrypt = await import("bcryptjs");

  const BCRYPT_COST = 12;

  try {
    // Check if admin already exists
    const existing = await db.query.superAdmins.findFirst();
    
    if (existing) {
      console.log("\n⚠ A super admin already exists.");
      console.log("Use the admin panel to create additional admins.");
      process.exit(0);
    }

    console.log("\n🔐 Create Super Admin\n");

    const email = await prompt("Email: ");
    if (!email || !email.includes("@")) {
      console.error("\n❌ Invalid email address");
      process.exit(1);
    }

    const password = await prompt("Password (min 8 chars): ");
    if (!password || password.length < 8) {
      console.error("\n❌ Password must be at least 8 characters");
      process.exit(1);
    }

    const name = await prompt("Name (default: Super Admin): ") || "Super Admin";

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
    console.log("\n🚀 Login at: http://localhost:3000/admin/login\n");
  } catch (error) {
    console.error("\n❌ Failed to create admin:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
