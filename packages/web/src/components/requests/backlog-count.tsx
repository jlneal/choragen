// ADR: ADR-011-web-api-architecture
"use client";

import Link from "next/link";
import { Archive } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

interface BacklogCountProps {
  className?: string;
}

/**
 * BacklogCount displays the number of requests in the backlog
 * with a link to the backlog page.
 */
export function BacklogCount({ className }: BacklogCountProps) {
  const { data: requests, isLoading } = trpc.requests.list.useQuery({
    status: "backlog",
  });

  const count = requests?.length ?? 0;

  if (isLoading) {
    return <Skeleton className="h-6 w-24" />;
  }

  if (count === 0) {
    return null;
  }

  return (
    <Link
      href="/backlog"
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
    >
      <Archive className="h-4 w-4" />
      <span>Backlog</span>
      <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-xs">
        {count}
      </Badge>
    </Link>
  );
}
