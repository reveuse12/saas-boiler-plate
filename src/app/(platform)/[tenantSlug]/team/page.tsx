/**
 * Team Page
 * Display and manage team members for the tenant
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface TeamPageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { tenantSlug } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground">
          Manage your team members and their roles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            View and manage members of {tenantSlug}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Team management coming soon</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2">
              This feature is under development. You&apos;ll be able to invite team members, 
              assign roles, and manage permissions here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
