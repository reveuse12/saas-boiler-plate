import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const context = await getAdminSession();

    if (!context) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      admin: {
        id: context.admin.id,
        email: context.admin.email,
        name: context.admin.name,
        role: context.admin.role,
        lastLoginAt: context.admin.lastLoginAt,
        createdAt: context.admin.createdAt,
      },
    });
  } catch (error) {
    console.error("Admin me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
