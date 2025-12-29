import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const context = await getAdminSession();
    if (!context) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const offset = (page - 1) * limit;

    // Get tenants with user counts
    const tenantsWithCounts = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        plan: tenants.plan,
        isSuspended: tenants.isSuspended,
        createdAt: tenants.createdAt,
        userCount: sql<number>`(SELECT COUNT(*) FROM users WHERE users.tenant_id = tenants.id)`,
      })
      .from(tenants)
      .orderBy(desc(tenants.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tenants);
    const total = Number(totalResult[0]?.count ?? 0);

    return NextResponse.json({
      tenants: tenantsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List tenants error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
