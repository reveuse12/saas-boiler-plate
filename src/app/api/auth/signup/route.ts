/**
 * Signup API Route
 * Creates a new tenant and user
 */
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { signupSchema } from "@/lib/validations/user";
import { tenantDAL } from "@/lib/dal";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, tenantName, tenantSlug } = parsed.data;

    // Check if slug is available
    const slugAvailable = await tenantDAL.isSlugAvailable(tenantSlug);
    if (!slugAvailable) {
      return NextResponse.json(
        { error: "This subdomain is already taken" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create tenant and user in a transaction
    const [tenant] = await db.insert(tenants).values({
      name: tenantName,
      slug: tenantSlug,
      plan: "free",
    }).returning();

    await db.insert(users).values({
      name,
      email,
      passwordHash,
      role: "owner",
      tenantId: tenant.id,
    });

    return NextResponse.json(
      { message: "Account created successfully", tenantSlug },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
