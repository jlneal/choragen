// ADR: ADR-011-web-api-architecture

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for a single session card.
 * Matches the dimensions and layout of SessionCard.
 */
export function SessionCardSkeleton() {
  return (
    <Card>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            {/* Chain ID */}
            <Skeleton className="h-5 w-48" />
            {/* Description */}
            <Skeleton className="h-4 w-56" />
          </div>
          {/* Status badge */}
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex items-center gap-4">
          {/* Agent */}
          <Skeleton className="h-4 w-12" />
          {/* Files count */}
          <Skeleton className="h-4 w-16" />
          {/* Started time */}
          <Skeleton className="h-4 w-24" />
          {/* Expires time */}
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </Card>
  );
}
