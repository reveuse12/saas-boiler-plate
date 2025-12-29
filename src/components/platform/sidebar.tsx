/**
 * Platform Sidebar Component
 * Collapsible navigation for the platform
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  tenantSlug: string;
  collapsed: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Todos", href: "/todos", icon: CheckSquare },
  { name: "Team", href: "/team", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ tenantSlug, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-sidebar transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href={`/${tenantSlug}/dashboard`} className="text-xl font-bold">
            {tenantSlug}
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-md hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-2">
        {navigation.map((item) => {
          const href = `/${tenantSlug}${item.href}`;
          const isActive = pathname.includes(item.href);

          return (
            <Link
              key={item.name}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout button at bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t p-2">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            "text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
