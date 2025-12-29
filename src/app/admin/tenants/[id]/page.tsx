"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
  userCount: number;
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [plan, setPlan] = useState<"free" | "pro" | "enterprise">("free");

  useEffect(() => {
    async function fetchTenant() {
      try {
        const response = await fetch(`/api/admin/tenants/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch tenant");
        const data = await response.json();
        setTenant(data.tenant);
        setName(data.tenant.name);
        setPlan(data.tenant.plan);
      } catch {
        setError("Failed to load tenant");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTenant();
  }, [params.id]);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/tenants/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, plan }),
      });

      if (!response.ok) throw new Error("Failed to update tenant");

      const data = await response.json();
      setTenant({ ...tenant!, ...data.tenant });
      setSuccess("Tenant updated successfully");
    } catch {
      setError("Failed to update tenant");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuspendToggle = async () => {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/tenants/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: !tenant?.isSuspended }),
      });

      if (!response.ok) throw new Error("Failed to update tenant");

      const data = await response.json();
      setTenant({ ...tenant!, ...data.tenant });
      setSuccess(data.tenant.isSuspended ? "Tenant suspended" : "Tenant unsuspended");
    } catch {
      setError("Failed to update tenant status");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/tenants/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete tenant");

      router.push("/admin/tenants");
    } catch {
      setError("Failed to delete tenant");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tenant) {
    return <div className="text-center text-red-500 py-8">Tenant not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{tenant.name}</h1>
          <p className="text-muted-foreground">Tenant ID: {tenant.id}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tenant Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={tenant.slug} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as typeof plan)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status & Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status</span>
              {tenant.isSuspended ? (
                <Badge variant="destructive">Suspended</Badge>
              ) : (
                <Badge variant="secondary">Active</Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span>Users</span>
              <span className="font-medium">{tenant.userCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Created</span>
              <span>{new Date(tenant.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="pt-4 space-y-2">
              <Button
                variant={tenant.isSuspended ? "default" : "outline"}
                className="w-full"
                onClick={handleSuspendToggle}
                disabled={isSaving}
              >
                {tenant.isSuspended ? "Unsuspend Tenant" : "Suspend Tenant"}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Tenant
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the tenant &quot;{tenant.name}&quot; and all
                      associated data including {tenant.userCount} users. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
