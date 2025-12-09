// ADR: ADR-011-web-api-architecture

import {
  PageHeaderSkeleton,
  FullCardSkeleton,
} from "@/components/loading-skeleton";

/**
 * Loading state for the chains page
 * Matches the layout of chains/page.tsx
 */
export default function ChainsLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header skeleton */}
      <PageHeaderSkeleton />

      {/* Chain list card skeleton */}
      <FullCardSkeleton />
    </div>
  );
}
