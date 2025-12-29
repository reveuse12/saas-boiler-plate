import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAdminSession();

  // If not authenticated, just render children (login page handles its own layout)
  if (!context) {
    return <>{children}</>;
  }

  // Authenticated - render with sidebar
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar admin={context.admin} />
        <main className="flex-1 ml-64">
          <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
