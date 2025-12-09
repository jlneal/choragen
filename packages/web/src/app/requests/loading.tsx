// ADR: ADR-011-web-api-architecture

import {
  PageHeaderSkeleton,
  FullCardSkeleton,
} from "@/components/loading-skeleton";

/**
 * Loading state for the requests page
 * Matches the layout of requests/page.tsx
 */
export default function RequestsLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header skeleton */}
      <PageHeaderSkeleton />

      {/* Request list card skeleton */}
      <FullCardSkeleton />
    </div>
  );
}
