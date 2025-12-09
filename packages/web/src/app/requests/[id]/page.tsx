// ADR: ADR-011-web-api-architecture

import Link from "next/link";
import { ArrowLeft, FileText, GitCommit, Link2, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({
  params,
}: RequestDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link
        href="/requests"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Requests
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6" />
          {id}
        </h1>
        <p className="text-muted-foreground">
          View request details, linked chains, and commits
        </p>
      </div>

      {/* Request Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Request Overview</CardTitle>
          <CardDescription>
            Status and metadata for this request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Type</p>
                <p className="text-sm text-muted-foreground">—</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground">—</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">—</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Linked Commits Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            Linked Commits
          </CardTitle>
          <CardDescription>
            Commits associated with this request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              This section will display all commits linked to this request,
              providing full traceability from request to implementation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
