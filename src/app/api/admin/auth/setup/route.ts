/**
 * Admin Setup API Route
 * POST - Complete admin account setup (set password)
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { superAdminDAL } from "@/lib/dal";

const setupSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = setupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Validate token
    const tokenData = await superAdminDAL.getValidSetupToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired setup link" },
        { status: 400 }
      );
    }

    // Check if already set up
    if (tokenData.admin.passwordHash) {
      return NextResponse.json(
        { error: "Account already set up. Please log in." },
        { status: 400 }
      );
    }

    // Complete setup
    await superAdminDAL.completeSetup(tokenData.tokenId, tokenData.adminId, password);

    return NextResponse.json({
      message: "Account setup complete. You can now log in.",
    });
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json(
      { error: "Failed to complete setup" },
      { status: 500 }
    );
  }
}

// GET - Validate token and return admin info
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const tokenData = await superAdminDAL.getValidSetupToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired setup link" },
        { status: 400 }
      );
    }

    if (tokenData.admin.passwordHash) {
      return NextResponse.json(
        { error: "Account already set up", alreadySetup: true },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      admin: {
        name: tokenData.admin.name,
        email: tokenData.admin.email,
        role: tokenData.admin.role,
      },
    });
  } catch (error) {
    console.error("Validate setup token error:", error);
    return NextResponse.json(
      { error: "Failed to validate token" },
      { status: 500 }
    );
  }
}
