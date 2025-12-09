// ADR: ADR-011-web-api-architecture

import { FileQuestion, Home, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Next.js 404 Not Found page
 * Displayed when a route is not found
 */
export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 rounded-full bg-muted p-4">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Check the URL or navigate back to the dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="default" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/chains">
                <Search className="mr-2 h-4 w-4" />
                Browse Chains
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
