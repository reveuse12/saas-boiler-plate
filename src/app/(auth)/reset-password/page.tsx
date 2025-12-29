"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details?.fieldErrors?.password) {
          setError(data.details.fieldErrors.password[0]);
        } else {
          setError(data.error || "Failed to reset password");
        }
        return;
      }

      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Invalid Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              This password reset link is invalid or has expired.
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Link href="/forgot-password">
              <Button variant="outline">Request new reset link</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Reset password
        </CardTitle>
        <CardDescription className="text-center">
          Enter your new password
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Password reset successfully! Redirecting to login...
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <p className="text-xs text-muted-foreground">
                Min 8 chars, 1 uppercase, 1 lowercase, 1 number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Resetting..." : "Reset password"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Card className="w-full"><CardContent className="p-6">Loading...</CardContent></Card>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
