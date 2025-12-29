/**
 * Mobile Navigation Component
 * Hamburger menu for mobile devices
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  Users,
  Menu,
  X,
} from "lucide-react";

interface MobileNavProps {
  tenantSlug: string;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Todos", href: "/todos", icon: CheckSquare },
  { name: "Team", href: "/team", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav({ tenantSlug }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
        <Link href={`/${tenantSlug}/dashboard`} className="text-xl font-bold">
          {tenantSlug}
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-md hover:bg-accent"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile menu overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <nav
        className={cn(
          "fixed top-16 left-0 right-0 z-40 bg-background border-b md:hidden transition-transform duration-200",
          open ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="flex flex-col p-4 space-y-2">
          {navigation.map((item) => {
            const href = `/${tenantSlug}${item.href}`;
            const isActive = pathname.includes(item.href);

            return (
              <Link
                key={item.name}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
