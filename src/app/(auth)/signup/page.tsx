"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FieldErrors {
  [key: string]: string[];
}

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    tenantName: "",
    tenantSlug: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: [] }));
    }

    if (name === "tenantName") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setFormData((prev) => ({ ...prev, tenantSlug: slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: ["Passwords don't match"] });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details?.fieldErrors) {
          setFieldErrors(data.details.fieldErrors);
        } else {
          setError(data.error || "Signup failed");
        }
        return;
      }

      router.push(`/login?tenant=${formData.tenantSlug}`);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (field: string) => fieldErrors[field]?.[0];

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Create your account
        </CardTitle>
        <CardDescription className="text-center">
          Start your free trial today
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
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
            {getFieldError("name") && (
              <p className="text-xs text-destructive">{getFieldError("name")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
            {getFieldError("email") && (
              <p className="text-xs text-destructive">{getFieldError("email")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenantName">Organization Name</Label>
            <Input
              id="tenantName"
              name="tenantName"
              type="text"
              value={formData.tenantName}
              onChange={handleChange}
              placeholder="Acme Inc"
              required
            />
            {getFieldError("tenantName") && (
              <p className="text-xs text-destructive">{getFieldError("tenantName")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenantSlug">Subdomain</Label>
            <div className="flex">
              <Input
                id="tenantSlug"
                name="tenantSlug"
                type="text"
                value={formData.tenantSlug}
                onChange={handleChange}
                placeholder="acme"
                className="rounded-r-none"
                required
              />
              <span className="inline-flex items-center px-3 border border-l-0 rounded-r-md bg-muted text-muted-foreground text-sm">
                .app.com
              </span>
            </div>
            {getFieldError("tenantSlug") && (
              <p className="text-xs text-destructive">{getFieldError("tenantSlug")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
            {getFieldError("password") && (
              <p className="text-xs text-destructive">{getFieldError("password")}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Min 8 chars, 1 uppercase, 1 lowercase, 1 number
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
            {getFieldError("confirmPassword") && (
              <p className="text-xs text-destructive">{getFieldError("confirmPassword")}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href="/login" className="font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
