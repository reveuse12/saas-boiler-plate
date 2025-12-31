/**
 * Invitations API Routes
 * POST - Create invitation (owner/admin only)
 * GET - List invitations for tenant
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createContext } from "@/lib/dal/context";
import { invitationsDAL } from "@/lib/dal";
import { createInvitationSchema } from "@/lib/validations/invitation";
import { ValidationError, ForbiddenError } from "@/lib/dal/errors";
import { sendEmail } from "@/lib/email";
import { invitationEmail } from "@/lib/email/templates";
import { env } from "@/lib/env";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only owner and admin can invite
    if (!["owner", "admin"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Only owners and admins can invite team members" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createInvitationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const ctx = createContext(session);
    const invitation = await invitationsDAL.createInvitation(
      ctx,
      parsed.data,
      session.user.role
    );

    // Get tenant name for email
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, session.user.tenantId),
    });

    // Build invite URL
    const inviteUrl = `${env.PROTOCOL}://${env.ROOT_DOMAIN}/invite/${invitation.token}`;

    // Send invitation email
    const emailContent = invitationEmail({
      inviterName: session.user.name,
      tenantName: tenant?.name || session.user.tenantSlug,
      role: invitation.role,
      inviteUrl,
      expiresIn: "7 days",
    });

    const emailResult = await sendEmail({
      to: invitation.email,
      subject: `You're invited to join ${tenant?.name || session.user.tenantSlug}`,
      html: emailContent.html,
      text: emailContent.text,
    });

    return NextResponse.json({
      message: "Invitation sent successfully",
      emailSent: emailResult.success,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        // Include token for dev/testing when email fails
        ...(process.env.NODE_ENV === "development" && !emailResult.success && { 
          token: invitation.token,
          inviteUrl,
        }),
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, details: { fieldErrors: error.fieldErrors } },
        { status: 400 }
      );
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Create invitation error:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only owner and admin can view invitations
    if (!["owner", "admin"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const ctx = createContext(session);
    const invitations = await invitationsDAL.listPendingInvitations(ctx);

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("List invitations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
