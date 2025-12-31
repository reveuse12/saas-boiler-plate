/**
 * Team Page
 * Display and manage team members for the tenant
 */
import { getDALContext, getRequiredSession } from "@/lib/auth-utils";
import { invitationsDAL } from "@/lib/dal";
import { TeamPageClient } from "@/components/team/team-page-client";

export default async function TeamPage() {
  const session = await getRequiredSession();
  const ctx = await getDALContext();

  const canManageTeam = ["owner", "admin"].includes(session.user.role);

  const [members, invitations] = await Promise.all([
    invitationsDAL.listTeamMembers(ctx),
    canManageTeam ? invitationsDAL.listPendingInvitations(ctx) : Promise.resolve([]),
  ]);

  return (
    <TeamPageClient
      members={members}
      invitations={invitations.map((inv) => ({
        ...inv,
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
      }))}
      currentUserId={session.user.id}
      userRole={session.user.role}
      canManageTeam={canManageTeam}
    />
  );
}
