/**
 * Auth Layout
 * Centered layout for login/signup pages
 */
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Simple header */}
      <header className="p-4">
        <Link href="/" className="text-xl font-bold">
          SaaS
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
