"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function LoginFormContent() {
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("tenant") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenant, setTenant] = useState(tenantSlug);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        tenantSlug: tenant,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email, password, or organization");
        setLoading(false);
        return;
      }

      window.location.href = `/${tenant}/dashboard`;
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Welcome back
        </CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="tenant">Organization</Label>
            <Input
              id="tenant"
              type="text"
              value={tenant}
              onChange={(e) => setTenant(e.target.value)}
              placeholder="your-organization"
              required
            />
            <p className="text-xs text-muted-foreground">
              Your organization subdomain
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href={`/forgot-password${tenant ? `?tenant=${tenant}` : ""}`}
                className="text-xs text-muted-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <Link href="/signup" className="font-medium hover:underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<Card className="w-full"><CardContent className="p-6">Loading...</CardContent></Card>}>
      <LoginFormContent />
    </Suspense>
  );
}
