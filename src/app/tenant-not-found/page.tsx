import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export default function TenantNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Building2 className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Organization Not Found</CardTitle>
          <CardDescription>
            The organization you're looking for doesn't exist or has been removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please check the URL and try again, or contact support if you believe
            this is an error.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
            <Link href="/signup">
              <Button>Create Organization</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
