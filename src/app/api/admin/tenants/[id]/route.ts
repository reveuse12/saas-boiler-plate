import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { auditLogDAL } from "@/lib/dal";
import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  plan: z.enum(["free", "pro", "enterprise"]).optional(),
  isSuspended: z.boolean().optional(),
});

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

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, id),
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Get user count
    const userCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.tenantId, id));
    const userCount = Number(userCountResult[0]?.count ?? 0);

    // Log the view action
    await auditLogDAL.createLog({
      adminId: context.admin.id,
      adminEmail: context.admin.email,
      action: "tenant.view",
      targetType: "tenant",
      targetId: id,
    });

    return NextResponse.json({
      tenant: { ...tenant, userCount },
    });
  } catch (error) {
    console.error("Get tenant error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body = await request.json();
    const parsed = updateTenantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existingTenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, id),
    });

    if (!existingTenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(tenants)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    // Determine action type for audit log
    let action: "tenant.update" | "tenant.suspend" | "tenant.unsuspend" = "tenant.update";
    if (parsed.data.isSuspended !== undefined) {
      action = parsed.data.isSuspended ? "tenant.suspend" : "tenant.unsuspend";
    }

    await auditLogDAL.createLog({
      adminId: context.admin.id,
      adminEmail: context.admin.email,
      action,
      targetType: "tenant",
      targetId: id,
      details: { changes: parsed.data },
    });

    return NextResponse.json({ tenant: updated });
  } catch (error) {
    console.error("Update tenant error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const existingTenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, id),
    });

    if (!existingTenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Delete tenant (cascade will remove users, todos, etc.)
    await db.delete(tenants).where(eq(tenants.id, id));

    await auditLogDAL.createLog({
      adminId: context.admin.id,
      adminEmail: context.admin.email,
      action: "tenant.delete",
      targetType: "tenant",
      targetId: id,
      details: { tenantName: existingTenant.name, tenantSlug: existingTenant.slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete tenant error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
