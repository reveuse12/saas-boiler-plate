import { NextResponse } from "next/server";
import { adminSessionDAL, auditLogDAL } from "@/lib/dal";
import { getAdminSession, clearAdminSessionCookie } from "@/lib/admin-auth";

export async function POST() {
  try {
    const context = await getAdminSession();

    if (context) {
      // Delete the session from database
      await adminSessionDAL.deleteSession(context.sessionToken);

      // Log the action
      await auditLogDAL.createLog({
        adminId: context.admin.id,
        adminEmail: context.admin.email,
        action: "admin.logout",
      });
    }

    // Clear the cookie
    await clearAdminSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin logout error:", error);
    // Still clear the cookie even if there's an error
    await clearAdminSessionCookie();
    return NextResponse.json({ success: true });
  }
}
