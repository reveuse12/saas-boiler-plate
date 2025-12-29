/**
 * Platform Shell Component
 * Wraps platform pages with sidebar and mobile nav
 */
"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { cn } from "@/lib/utils";

interface PlatformShellProps {
  children: React.ReactNode;
  tenantSlug: string;
}

export function PlatformShell({ children, tenantSlug }: PlatformShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar
          tenantSlug={tenantSlug}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile navigation */}
      <MobileNav tenantSlug={tenantSlug} />

      {/* Main content */}
      <main
        className={cn(
          "min-h-screen transition-all duration-200",
          "pt-16 md:pt-0", // Account for mobile header
          collapsed ? "md:pl-16" : "md:pl-64"
        )}
      >
        <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
