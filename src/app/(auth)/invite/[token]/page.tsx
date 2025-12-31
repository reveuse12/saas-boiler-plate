/**
 * Accept Invitation Page
 * Allows invited users to create their account
 */
import { notFound } from "next/navigation";
import { invitationsDAL } from "@/lib/dal";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";

interface AcceptInvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function AcceptInvitePage({ params }: AcceptInvitePageProps) {
  const { token } = await params;
  
  const invitation = await invitationsDAL.getInvitationByToken(token);
  
  if (!invitation) {
    notFound();
  }

  // Check if invitation is still valid
  if (invitation.status !== "pending") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Invalid Invitation</h1>
        <p className="text-muted-foreground">
          This invitation has already been {invitation.status}.
        </p>
      </div>
    );
  }

  if (invitation.expiresAt < new Date()) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Invitation Expired</h1>
        <p className="text-muted-foreground">
          This invitation has expired. Please ask for a new one.
        </p>
      </div>
    );
  }

  // Get tenant info
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, invitation.tenantId),
  });

  if (!tenant) {
    notFound();
  }

  return (
    <AcceptInviteForm
      token={token}
      email={invitation.email}
      role={invitation.role}
      tenantName={tenant.name}
    />
  );
}
