import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/db";
import { users, tenants } from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";

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

    // Get users with tenant info
    const usersWithTenants = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        tenantId: users.tenantId,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const total = Number(totalResult[0]?.count ?? 0);

    return NextResponse.json({
      users: usersWithTenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
