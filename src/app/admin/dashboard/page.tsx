"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Loader2 } from "lucide-react";

interface Stats {
  totalTenants: number;
  totalUsers: number;
  planDistribution: {
    free: number;
    pro: number;
    enterprise: number;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/dashboard/stats");
        if (response.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }
        const data = await response.json();
        setStats(data);
      } catch {
        setError("Failed to load dashboard stats");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and statistics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTenants ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Free</div>
              <div className="text-2xl font-bold">{stats?.planDistribution.free ?? 0}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Pro</div>
              <div className="text-2xl font-bold">{stats?.planDistribution.pro ?? 0}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Enterprise</div>
              <div className="text-2xl font-bold">{stats?.planDistribution.enterprise ?? 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
