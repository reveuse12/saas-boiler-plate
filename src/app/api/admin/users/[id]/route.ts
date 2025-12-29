import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { auditLogDAL } from "@/lib/dal";
import { db } from "@/db";
import { users, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getAdminSession();
    if (!context) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        tenantId: users.tenantId,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .where(eq(users.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Log the view action
    await auditLogDAL.createLog({
      adminId: context.admin.id,
      adminEmail: context.admin.email,
      action: "user.view",
      targetType: "user",
      targetId: id,
    });

    return NextResponse.json({ user: result[0] });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
