import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { superAdminDAL, auditLogDAL } from "@/lib/dal";

const createAdminSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["primary_admin", "admin"]),
});

export async function GET() {
  try {
    const context = await getAdminSession();
    if (!context) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only primary admins can view admin list
    if (context.admin.role !== "primary_admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const admins = await superAdminDAL.listAll();

    // Remove sensitive fields
    const safeAdmins = admins.map((admin) => ({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
    }));

    return NextResponse.json({ admins: safeAdmins });
  } catch (error) {
    console.error("List admins error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getAdminSession();
    if (!context) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only primary admins can create new admins
    if (context.admin.role !== "primary_admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createAdminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await superAdminDAL.findByEmail(parsed.data.email);
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    const admin = await superAdminDAL.create(parsed.data);

    await auditLogDAL.createLog({
      adminId: context.admin.id,
      adminEmail: context.admin.email,
      action: "admin.create",
      targetType: "admin",
      targetId: admin.id,
      details: { email: admin.email, role: admin.role },
    });

    return NextResponse.json({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
