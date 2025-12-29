"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  isSuspended: boolean;
  createdAt: string;
  userCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchTenants() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/tenants?page=${currentPage}&limit=10`);
        if (!response.ok) throw new Error("Failed to fetch tenants");
        const data = await response.json();
        setTenants(data.tenants);
        setPagination(data.pagination);
      } catch {
        setError("Failed to load tenants");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTenants();
  }, [currentPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tenants</h1>
        <p className="text-muted-foreground">Manage all platform tenants</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tenants ({pagination?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>{tenant.slug}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {tenant.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>{tenant.userCount}</TableCell>
                  <TableCell>
                    {tenant.isSuspended ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : (
                      <Badge variant="secondary">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/tenants/${tenant.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
