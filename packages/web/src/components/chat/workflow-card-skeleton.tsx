// ADR: ADR-011-web-api-architecture
"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkflowCardSkeletonProps {
  count?: number;
}

export function WorkflowCardSkeleton({ count = 4 }: WorkflowCardSkeletonProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-28" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
