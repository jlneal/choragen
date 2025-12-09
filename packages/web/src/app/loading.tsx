// ADR: ADR-011-web-api-architecture

import {
  PageHeaderSkeleton,
  StatsGridSkeleton,
  FullCardSkeleton,
} from "@/components/loading-skeleton";

/**
 * Root loading state for the dashboard
 * Matches the layout of the home page (page.tsx)
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page Header skeleton */}
      <PageHeaderSkeleton />

      {/* Stats Grid skeleton */}
      <StatsGridSkeleton />

      {/* Recent Activity card skeleton */}
      <FullCardSkeleton />

      {/* Getting Started card skeleton */}
      <FullCardSkeleton />
    </div>
  );
}
