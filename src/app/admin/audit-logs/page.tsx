"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const actionColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "admin.login": "secondary",
  "admin.logout": "secondary",
  "admin.create": "default",
  "admin.delete": "destructive",
  "tenant.view": "outline",
  "tenant.update": "default",
  "tenant.suspend": "destructive",
  "tenant.unsuspend": "default",
  "tenant.delete": "destructive",
  "user.view": "outline",
  "user.reset_password": "default",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchLogs() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/audit-logs?page=${currentPage}&limit=20`);
        if (!response.ok) throw new Error("Failed to fetch logs");
        const data = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      } catch {
        setError("Failed to load audit logs");
      } finally {
        setIsLoading(false);
      }
    }

    fetchLogs();
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
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Track all administrative actions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log ({pagination?.total ?? 0} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.adminEmail}</TableCell>
                  <TableCell>
                    <Badge variant={actionColors[log.action] ?? "outline"}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.targetType && log.targetId ? (
                      <span className="text-sm">
                        {log.targetType}: {log.targetId.slice(0, 8)}...
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.details ? (
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {log.details.slice(0, 50)}
                        {log.details.length > 50 ? "..." : ""}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
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
