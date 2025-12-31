"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Mail } from "lucide-react";
import { InviteMemberDialog } from "./invite-member-dialog";
import { TeamMembersList } from "./team-members-list";
import { PendingInvitations } from "./pending-invitations";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  createdAt: Date;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string } | null;
}

interface TeamPageClientProps {
  members: TeamMember[];
  invitations: Invitation[];
  currentUserId: string;
  userRole: "owner" | "admin" | "member";
  canManageTeam: boolean;
}

export function TeamPageClient({
  members,
  invitations: initialInvitations,
  currentUserId,
  userRole,
  canManageTeam,
}: TeamPageClientProps) {
  const [invitations, setInvitations] = useState(initialInvitations);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleInviteSent = async () => {
    // Refresh invitations list
    const res = await fetch("/api/invitations");
    if (res.ok) {
      const data = await res.json();
      setInvitations(data.invitations);
    }
    setRefreshKey((k) => k + 1);
  };

  const handleRevoke = (id: string) => {
    setInvitations((prev) => prev.filter((inv) => inv.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and invitations.
          </p>
        </div>
        {canManageTeam && (
          <InviteMemberDialog userRole={userRole} onInviteSent={handleInviteSent} />
        )}
      </div>

      <Tabs defaultValue="members" key={refreshKey}>
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members ({members.length})
          </TabsTrigger>
          {canManageTeam && (
            <TabsTrigger value="invitations" className="gap-2">
              <Mail className="h-4 w-4" />
              Pending ({invitations.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                People who have access to this organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamMembersList members={members} currentUserId={currentUserId} />
            </CardContent>
          </Card>
        </TabsContent>

        {canManageTeam && (
          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  Invitations that haven&apos;t been accepted yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PendingInvitations invitations={invitations} onRevoke={handleRevoke} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
