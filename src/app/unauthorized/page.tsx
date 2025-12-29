import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <ShieldX className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact your administrator
            or try logging in with a different account.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
