/**
 * Forgot Password API Route
 * Generates a password reset token and returns it
 * In production, this would send an email instead of returning the token
 */
import { NextResponse } from "next/server";
import { passwordResetDAL } from "@/lib/dal";
import { forgotPasswordSchema } from "@/lib/validations/user";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, tenantSlug } = parsed.data;

    // Generate token (returns null if user not found, but we don't reveal that)
    const token = await passwordResetDAL.createPasswordResetToken(
      email,
      tenantSlug
    );

    // Always return success to prevent email enumeration
    // In production, send email here if token was generated
    if (token) {
      // TODO: Send email with reset link
      // For development, we'll include the token in the response
      console.log(`Password reset token for ${email}: ${token}`);
      
      // In development, return the token for testing
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({
          message: "If an account exists, a password reset link has been sent.",
          // Only in development - remove in production!
          _devToken: token,
        });
      }
    }

    return NextResponse.json({
      message: "If an account exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
