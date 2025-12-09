// ADR: ADR-011-web-api-architecture

import Link from "next/link";
import { ArrowLeft, GitBranch, CheckCircle2, Clock, Circle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ChainDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChainDetailPage({ params }: ChainDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link
        href="/chains"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Chains
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GitBranch className="h-6 w-6" />
          Chain: {id}
        </h1>
        <p className="text-muted-foreground">
          View chain details, tasks, and progress
        </p>
      </div>

      {/* Chain Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Chain Overview</CardTitle>
          <CardDescription>
            Status and metadata for this task chain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Circle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground">—</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Tasks Completed</p>
                <p className="text-sm text-muted-foreground">—</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">—</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>
            All tasks in this chain and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              This section will display the task list with status indicators,
              allowing you to track progress and manage individual tasks.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
