/**
 * Admin Setup Page
 * Allows new admins to set their password
 */
import { redirect } from "next/navigation";
import { superAdminDAL } from "@/lib/dal";
import { AdminSetupForm } from "@/components/admin/admin-setup-form";

interface AdminSetupPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AdminSetupPage({ searchParams }: AdminSetupPageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/admin/login");
  }

  const tokenData = await superAdminDAL.getValidSetupToken(token);

  if (!tokenData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid or Expired Link</h1>
          <p className="text-muted-foreground mb-4">
            This setup link is no longer valid. Please contact your administrator.
          </p>
          <a href="/admin/login" className="text-primary hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (tokenData.admin.passwordHash) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <AdminSetupForm
        token={token}
        adminName={tokenData.admin.name}
        adminEmail={tokenData.admin.email}
        adminRole={tokenData.admin.role}
      />
    </div>
  );
}
