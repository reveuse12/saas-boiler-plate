import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const context = await getAdminSession();
    if (!context) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get total tenant count
    const tenantCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tenants);
    const totalTenants = Number(tenantCountResult[0]?.count ?? 0);

    // Get total user count
    const userCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const totalUsers = Number(userCountResult[0]?.count ?? 0);

    // Get plan distribution
    const planDistribution = await db
      .select({
        plan: tenants.plan,
        count: sql<number>`count(*)`,
      })
      .from(tenants)
      .groupBy(tenants.plan);

    const planStats = {
      free: 0,
      pro: 0,
      enterprise: 0,
    };

    for (const row of planDistribution) {
      if (row.plan in planStats) {
        planStats[row.plan as keyof typeof planStats] = Number(row.count);
      }
    }

    return NextResponse.json({
      totalTenants,
      totalUsers,
      planDistribution: planStats,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
