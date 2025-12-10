// ADR: ADR-011-web-api-architecture

import { Clock, Timer } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { SessionStatusBadge, type SessionStatus } from "./session-status-badge";

interface SessionHeaderProps {
  /** Chain ID this session is working on */
  chainId: string;
  /** Session status */
  status: SessionStatus;
  /** When the session started */
  startedAt: Date;
  /** When the session lock expires */
  expiresAt?: Date;
}

/**
 * Format a date for display
 */
function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * SessionHeader displays the header section of a session detail page.
 * Shows chain ID, status badge, and timing information.
 */
export function SessionHeader({
  chainId,
  status,
  startedAt,
  expiresAt,
}: SessionHeaderProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{chainId}</h1>
              <SessionStatusBadge status={status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Agent session for this chain
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>Started {formatDateTime(startedAt)}</span>
          </div>
          {expiresAt && (
            <div className="flex items-center gap-1.5">
              <Timer className="h-4 w-4" />
              <span>Expires {formatDateTime(expiresAt)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for SessionHeader
 */
export function SessionHeaderSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-6">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-36" />
        </div>
      </CardContent>
    </Card>
  );
}
