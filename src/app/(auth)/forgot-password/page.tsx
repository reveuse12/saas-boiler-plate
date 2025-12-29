"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("tenant") || "";

  const [email, setEmail] = useState("");
  const [tenant, setTenant] = useState(tenantSlug);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [devToken, setDevToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setDevToken("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tenantSlug: tenant }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to process request");
        return;
      }

      setSuccess(true);
      // In development, show the token for testing
      if (data._devToken) {
        setDevToken(data._devToken);
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Forgot password
        </CardTitle>
        <CardDescription className="text-center">
          Enter your email to receive a password reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                If an account exists with that email, we've sent a password reset link.
              </AlertDescription>
            </Alert>
            {devToken && (
              <Alert>
                <AlertDescription className="break-all">
                  <strong>Dev Mode:</strong> Reset link:{" "}
                  <Link
                    href={`/reset-password?token=${devToken}`}
                    className="text-primary underline"
                  >
                    /reset-password?token={devToken}
                  </Link>
                </AlertDescription>
              </Alert>
            )}
            <div className="text-center">
              <Link href="/login" className="text-sm text-primary hover:underline">
                Back to login
              </Link>
            </div>
          </div>
        ) : (
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </Button>

            <div className="text-center text-sm">
              <Link href="/login" className="text-muted-foreground hover:underline">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<Card className="w-full"><CardContent className="p-6">Loading...</CardContent></Card>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
