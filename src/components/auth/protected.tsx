/**
 * Protected wrapper component for server components
 * Ensures authentication before rendering children
 */
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

interface ProtectedProps {
  children: React.ReactNode;
  requiredRoles?: ("owner" | "admin" | "member")[];
  fallback?: React.ReactNode;
}

/**
 * Server component that protects its children
 * Redirects to login if not authenticated
 * Optionally checks for required roles
 */
export async function Protected({
  children,
  requiredRoles,
  fallback,
}: ProtectedProps) {
  const session = await auth();

  // Not authenticated
  if (!session?.user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    redirect("/login");
  }

  // Check role if required
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(session.user.role)) {
      if (fallback) {
        return <>{fallback}</>;
      }
      redirect("/unauthorized");
    }
  }

  return <>{children}</>;
}

/**
 * Higher-order function to protect server actions
 */
export function withAuth<T extends unknown[], R>(
  action: (session: { user: { id: string; email: string; name: string; role: "owner" | "admin" | "member"; tenantId: string; tenantSlug: string } }, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    return action(session as { user: { id: string; email: string; name: string; role: "owner" | "admin" | "member"; tenantId: string; tenantSlug: string } }, ...args);
  };
}
