import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { superAdminDAL, adminSessionDAL, auditLogDAL } from "@/lib/dal";
import { setAdminSessionCookie } from "@/lib/admin-auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Find admin by email
    const admin = await superAdminDAL.findByEmail(email);
    if (!admin) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (await superAdminDAL.isLocked(admin)) {
      return NextResponse.json(
        { error: "Account temporarily locked. Please try again later." },
        { status: 423 }
      );
    }

    // Check if account is active
    if (!admin.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await superAdminDAL.verifyPassword(admin, password);
    if (!isValid) {
      await superAdminDAL.recordFailedLogin(admin.id);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    const session = await adminSessionDAL.createSession(admin.id);
    await superAdminDAL.recordSuccessfulLogin(admin.id);

    // Set cookie
    await setAdminSessionCookie(session.token);

    // Log the action
    await auditLogDAL.createLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "admin.login",
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
