// ADR: ADR-011-web-api-architecture

/**
 * ChainHeader - Displays chain metadata in detail view
 *
 * Shows chain ID, title, type badge, status badge, progress bar,
 * created date, and request ID link.
 */

import Link from "next/link";
import { Calendar, FileText, GitBranch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { ChainProgress } from "./chain-progress";
import { ChainStatusBadge, type ChainStatus } from "./chain-status-badge";
import { type ChainType } from "./chain-card";

interface ChainHeaderProps {
  /** Chain ID (e.g., "CHAIN-044-chain-task-viewer") */
  id: string;
  /** Chain title */
  title: string;
  /** Chain type */
  type?: ChainType;
  /** Associated request ID (e.g., "CR-20251208-001") */
  requestId: string;
  /** Current chain status */
  status: ChainStatus;
  /** Completion progress (0-100) */
  progress: number;
  /** Created date as ISO string */
  createdAt?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Type badge styling configuration
 */
const typeConfig: Record<ChainType, { label: string; className: string }> = {
  design: {
    label: "Design",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  },
  implementation: {
    label: "Implementation",
    className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  },
};

/**
 * Format a date string for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * ChainHeader displays the main metadata for a chain in the detail view.
 */
export function ChainHeader({
  id,
  title,
  type,
  requestId,
  status,
  progress,
  createdAt,
  className,
}: ChainHeaderProps) {
  const typeStyle = type ? typeConfig[type] : null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Title and badges row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">{id}</h1>
          </div>
          <p className="text-muted-foreground">{title}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {typeStyle && (
            <Badge
              variant="outline"
              className={cn("border-transparent", typeStyle.className)}
            >
              {typeStyle.label}
            </Badge>
          )}
          <ChainStatusBadge status={status} />
        </div>
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {/* Request link */}
        <Link
          href={`/requests/${requestId}`}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <FileText className="h-4 w-4" />
          <span>{requestId}</span>
        </Link>

        {/* Created date */}
        {createdAt && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>Created {formatDate(createdAt)}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="pt-2">
        <ChainProgress progress={progress} showLabel size="lg" />
      </div>
    </div>
  );
}

/**
 * Loading skeleton for ChainHeader
 */
export function ChainHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Title and badges row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-5 w-48" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Progress bar */}
      <div className="pt-2">
        <Skeleton className="h-3 w-full rounded-full" />
      </div>
    </div>
  );
}
