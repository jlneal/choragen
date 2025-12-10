// ADR: ADR-011-web-api-architecture

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MetricCardSkeletonProps {
  /** Additional class names */
  className?: string;
}

/**
 * MetricCardSkeleton provides a loading state for MetricCard.
 * Matches the dimensions and layout of the actual card.
 */
export function MetricCardSkeleton({ className }: MetricCardSkeletonProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {/* Title skeleton */}
        <Skeleton className="h-4 w-24" />
        {/* Icon skeleton */}
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          {/* Value skeleton */}
          <Skeleton className="h-8 w-16" />
          {/* Trend skeleton */}
          <Skeleton className="h-4 w-12" />
        </div>
        {/* Description skeleton */}
        <Skeleton className="h-3 w-32 mt-2" />
      </CardContent>
    </Card>
  );
}
