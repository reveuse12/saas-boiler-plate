/**
 * Platform Layout
 * Handles tenant context validation and provides sidebar wrapper
 */
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { tenantDAL } from "@/lib/dal";
import { PlatformShell } from "@/components/platform/platform-shell";

interface PlatformLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}

export default async function PlatformLayout({
  children,
  params,
}: PlatformLayoutProps) {
  const { tenantSlug } = await params;

  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?tenant=${tenantSlug}`);
  }

  // Verify tenant exists
  const tenant = await tenantDAL.getTenantBySlug(tenantSlug);
  if (!tenant) {
    notFound();
  }

  // Verify user belongs to this tenant
  if (session.user.tenantId !== tenant.id) {
    redirect(`/login?tenant=${tenantSlug}&error=wrong_tenant`);
  }

  return (
    <PlatformShell tenantSlug={tenantSlug}>
      {children}
    </PlatformShell>
  );
}
