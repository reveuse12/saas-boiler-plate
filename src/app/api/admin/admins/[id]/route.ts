import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { superAdminDAL, auditLogDAL } from "@/lib/dal";

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

    // Only primary admins can delete admins
    if (context.admin.role !== "primary_admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Cannot delete yourself
    if (id === context.admin.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const targetAdmin = await superAdminDAL.findById(id);
    if (!targetAdmin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

    // If deleting a primary admin, ensure at least one remains
    if (targetAdmin.role === "primary_admin") {
      const primaryCount = await superAdminDAL.countPrimaryAdmins();
      if (primaryCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last primary admin" },
          { status: 400 }
        );
      }
    }

    await superAdminDAL.deleteAdmin(id);

    await auditLogDAL.createLog({
      adminId: context.admin.id,
      adminEmail: context.admin.email,
      action: "admin.delete",
      targetType: "admin",
      targetId: id,
      details: { email: targetAdmin.email, role: targetAdmin.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
