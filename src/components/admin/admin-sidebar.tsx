"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  Users,
  ScrollText,
  Shield,
  LogOut,
} from "lucide-react";
import type { SuperAdmin } from "@/db/schema";

interface AdminSidebarProps {
  admin: SuperAdmin;
}

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
];

const primaryAdminItems = [
  { href: "/admin/admins", label: "Admins", icon: Shield },
];

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    // Use window.location for full page refresh
    window.location.href = "/admin/login";
  };

  const allNavItems = admin.role === "primary_admin" 
    ? [...navItems, ...primaryAdminItems]
    : navItems;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <Shield className="h-6 w-6 text-primary mr-2" />
          <span className="font-semibold text-lg">Super Admin</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium">{admin.name}</p>
            <p className="text-xs text-muted-foreground">{admin.email}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {admin.role.replace("_", " ")}
            </p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}
