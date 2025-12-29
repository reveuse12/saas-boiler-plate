/**
 * Settings Page
 */
import { getRequiredSession } from "@/lib/auth-utils";
import { tenantDAL } from "@/lib/dal";
import { signOut } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { ProfileForm } from "@/components/auth/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SettingsPageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { tenantSlug } = await params;
  const session = await getRequiredSession();
  const tenant = await tenantDAL.getTenantBySlug(tenantSlug);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and organization settings
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialName={session.user.name}
            email={session.user.email}
            role={session.user.role}
          />
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {/* Organization Section */}
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Your organization details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Name
            </label>
            <p className="text-sm">{tenant?.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Subdomain
            </label>
            <p className="text-sm">{tenant?.slug}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Plan
            </label>
            <p className="text-sm capitalize">{tenant?.plan}</p>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>Manage your current session</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="destructive">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
