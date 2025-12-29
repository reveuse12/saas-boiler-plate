"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, KeyRound } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  tenantName: string | null;
  tenantSlug: string | null;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetLink, setResetLink] = useState("");

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`/api/admin/users/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch user");
        const data = await response.json();
        setUser(data.user);
      } catch {
        setError("Failed to load user");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [params.id]);

  const handleResetPassword = async () => {
    setIsResetting(true);
    setError("");
    setSuccess("");
    setResetLink("");

    try {
      const response = await fetch(`/api/admin/users/${params.id}/reset-password`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to reset password");

      const data = await response.json();
      setSuccess("Password reset token generated");
      setResetLink(data.resetLink);
    } catch {
      setError("Failed to generate password reset");
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-center text-red-500 py-8">User not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>
            {success}
            {resetLink && (
              <div className="mt-2">
                <code className="text-xs bg-muted p-1 rounded">{resetLink}</code>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono text-sm">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="outline" className="capitalize">
                {user.role}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(user.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated</span>
              <span>{new Date(user.updatedAt).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant & Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tenant</span>
              {user.tenantName ? (
                <Link
                  href={`/admin/tenants/${user.tenantId}`}
                  className="text-primary hover:underline"
                >
                  {user.tenantName}
                </Link>
              ) : (
                <span>-</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tenant Slug</span>
              <span>{user.tenantSlug ?? "-"}</span>
            </div>

            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResetPassword}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Generate Password Reset
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
