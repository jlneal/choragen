// ADR: ADR-011-web-api-architecture
"use client";

import { cn } from "@/lib/utils";

interface RankBadgeProps {
  rank: number;
  className?: string;
}

/**
 * RankBadge displays the priority rank number for a backlog request.
 * Lower numbers indicate higher priority.
 */
export function RankBadge({ rank, className }: RankBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        "w-8 h-8 rounded-full",
        "bg-primary/10 text-primary",
        "text-sm font-semibold",
        "shrink-0",
        className
      )}
      title={`Priority rank: ${rank}`}
    >
      {rank}
    </div>
  );
}
