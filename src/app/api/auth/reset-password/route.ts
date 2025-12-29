/**
 * Reset Password API Route
 * Validates token and updates user password
 */
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { passwordResetDAL } from "@/lib/dal";
import { resetPasswordSchema } from "@/lib/validations/user";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Validate token
    const tokenData = await passwordResetDAL.getValidToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hash(password, 12);

    // Update user password
    await db
      .update(users)
      .set({ 
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, tokenData.userId));

    // Invalidate the token
    await passwordResetDAL.invalidateToken(tokenData.tokenId);

    return NextResponse.json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
