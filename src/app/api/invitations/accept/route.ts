/**
 * Accept Invitation API Route
 * POST - Accept invitation and create user account
 */
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { invitationsDAL } from "@/lib/dal";
import { acceptInvitationSchema } from "@/lib/validations/invitation";
import { ValidationError, NotFoundError } from "@/lib/dal/errors";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email/templates";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = acceptInvitationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, name, password } = parsed.data;
    const passwordHash = await hash(password, 12);

    const { invitation, user } = await invitationsDAL.acceptInvitation(token, {
      name,
      passwordHash,
    });

    // Get tenant for redirect and email
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, invitation.tenantId),
    });

    // Send welcome email
    if (tenant) {
      const loginUrl = `${env.PROTOCOL}://${env.ROOT_DOMAIN}/login?tenant=${tenant.slug}`;
      
      const emailContent = welcomeEmail({
        userName: name,
        tenantName: tenant.name,
        loginUrl,
      });

      await sendEmail({
        to: user.email,
        subject: `Welcome to ${tenant.name}!`,
        html: emailContent.html,
        text: emailContent.text,
      });
    }

    return NextResponse.json({
      message: "Account created successfully",
      tenantSlug: tenant?.slug,
      email: user.email,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, details: { fieldErrors: error.fieldErrors } },
        { status: 400 }
      );
    }
    console.error("Accept invitation error:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
