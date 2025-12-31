/**
 * Forgot Password API Route
 * Generates a password reset token and sends email
 */
import { NextResponse } from "next/server";
import { passwordResetDAL } from "@/lib/dal";
import { forgotPasswordSchema } from "@/lib/validations/user";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email/templates";
import { env } from "@/lib/env";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { tenants } from "@/db/schema";

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
    if (token) {
      // Get user name for email personalization
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.slug, tenantSlug),
      });

      let userName: string | undefined;
      if (tenant) {
        const user = await db.query.users.findFirst({
          where: and(
            eq(users.email, email.toLowerCase()),
            eq(users.tenantId, tenant.id)
          ),
        });
        userName = user?.name;
      }

      // Build reset URL
      const resetUrl = `${env.PROTOCOL}://${env.ROOT_DOMAIN}/reset-password?token=${token}&tenant=${tenantSlug}`;

      // Send email
      const emailContent = passwordResetEmail({
        userName,
        resetUrl,
        expiresIn: "1 hour",
      });

      const emailResult = await sendEmail({
        to: email,
        subject: "Reset your password",
        html: emailContent.html,
        text: emailContent.text,
      });

      // In development, return token if email fails
      if (process.env.NODE_ENV === "development" && !emailResult.success) {
        return NextResponse.json({
          message: "If an account exists, a password reset link has been sent.",
          _devToken: token,
          _devResetUrl: resetUrl,
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
