// ADR: ADR-011-web-api-architecture
"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MessageSkeletonProps {
  alignment?: "left" | "right";
  className?: string;
}

export function MessageSkeleton({ alignment = "left", className }: MessageSkeletonProps) {
  const alignmentClass = alignment === "right" ? "justify-end" : "justify-start";
  const bubbleClass =
    alignment === "right"
      ? "border-primary/40 bg-primary/10"
      : "border-border bg-muted/40";

  return (
    <div className={cn("flex", alignmentClass, className)}>
      <div
        className={cn(
          "max-w-[720px] w-full rounded-lg border p-3 shadow-sm",
          bubbleClass
        )}
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
      </div>
    </div>
  );
}
