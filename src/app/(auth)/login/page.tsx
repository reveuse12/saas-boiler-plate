import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  // Server-side check: if already logged in, redirect to dashboard
  const session = await auth();
  if (session?.user?.tenantSlug) {
    redirect(`/${session.user.tenantSlug}/dashboard`);
  }

  return <LoginForm />;
}
