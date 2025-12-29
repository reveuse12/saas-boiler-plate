import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default async function AdminLoginPage() {
  // Server-side check: if already logged in, redirect to dashboard
  const context = await getAdminSession();
  if (context) {
    redirect("/admin/dashboard");
  }

  return <AdminLoginForm />;
}
