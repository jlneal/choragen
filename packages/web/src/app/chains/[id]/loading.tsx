// ADR: ADR-011-web-api-architecture

import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChainHeaderSkeleton } from "@/components/chains";
import { TaskListSkeleton } from "@/components/tasks";

/**
 * Loading state for the chain detail page
 * Matches the layout of chains/[id]/chain-detail-content.tsx
 */
export default function ChainDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Back Navigation skeleton */}
      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Chain Header skeleton */}
      <ChainHeaderSkeleton />

      {/* Tasks Card skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <TaskListSkeleton count={3} />
        </CardContent>
      </Card>
    </div>
  );
}
