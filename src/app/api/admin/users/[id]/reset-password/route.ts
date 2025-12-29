import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { auditLogDAL, passwordResetDAL } from "@/lib/dal";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAdminSession();
    if (!context) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create password reset token
    const { token } = await passwordResetDAL.createToken(user.id, user.tenantId);

    // Log the action
    await auditLogDAL.createLog({
      adminId: context.admin.id,
      adminEmail: context.admin.email,
      action: "user.reset_password",
      targetType: "user",
      targetId: id,
      details: { userEmail: user.email },
    });

    // In production, you would send this via email
    // For now, return the reset link
    const resetLink = `/reset-password?token=${token}`;

    return NextResponse.json({
      success: true,
      message: "Password reset token generated",
      resetLink, // In production, don't return this - send via email
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
