/**
 * Single Invitation API Routes
 * DELETE - Revoke invitation
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createContext } from "@/lib/dal/context";
import { invitationsDAL } from "@/lib/dal";
import { ValidationError, ForbiddenError, NotFoundError } from "@/lib/dal/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only owner and admin can revoke
    if (!["owner", "admin"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Only owners and admins can revoke invitations" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const ctx = createContext(session);
    await invitationsDAL.revokeInvitation(ctx, id);

    return NextResponse.json({ message: "Invitation revoked" });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, details: { fieldErrors: error.fieldErrors } },
        { status: 400 }
      );
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Revoke invitation error:", error);
    return NextResponse.json(
      { error: "Failed to revoke invitation" },
      { status: 500 }
    );
  }
}
