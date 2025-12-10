"use client";

// ADR: ADR-011-web-api-architecture

/**
 * TaskHistory - Displays a timeline of task state changes
 *
 * Shows status transitions with timestamps and optional metadata like rework reasons.
 * Uses pipeline events from MetricsCollector to build the history.
 */

import {
  Play,
  CheckCircle,
  RotateCcw,
  Clock,
  type LucideIcon,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

import { TaskStatusBadge, type TaskStatus } from "./task-status-badge";

interface TaskHistoryProps {
  /** Chain ID of the task */
  chainId: string;
  /** Task ID to display history for */
  taskId: string;
  /** Optional className for the container */
  className?: string;
}

/**
 * Event type configuration for display
 */
type TaskEventType = "task:started" | "task:completed" | "task:rework";

const eventConfig: Record<
  TaskEventType,
  {
    label: string;
    description: string;
    Icon: LucideIcon;
    iconClassName: string;
    toStatus: TaskStatus;
  }
> = {
  "task:started": {
    label: "Started",
    description: "Task work began",
    Icon: Play,
    iconClassName: "text-amber-600 dark:text-amber-400",
    toStatus: "in-progress",
  },
  "task:completed": {
    label: "Completed",
    description: "Task submitted for review",
    Icon: CheckCircle,
    iconClassName: "text-green-600 dark:text-green-400",
    toStatus: "in-review",
  },
  "task:rework": {
    label: "Sent for Rework",
    description: "Task returned for changes",
    Icon: RotateCcw,
    iconClassName: "text-purple-600 dark:text-purple-400",
    toStatus: "in-progress",
  },
};

/**
 * Format a timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatTimestamp(timestamp);
}

/**
 * Loading skeleton for task history
 */
export function TaskHistorySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <Skeleton className="h-8 w-8 rounded-full" />
            {i < 3 && <Skeleton className="w-0.5 h-12 mt-2" />}
          </div>
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no history is available
 */
function TaskHistoryEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground">No history yet</p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Status changes will appear here once the task is started
      </p>
    </div>
  );
}

/**
 * Single history entry in the timeline
 */
function HistoryEntry({
  eventType,
  timestamp,
  metadata,
  isLast,
}: {
  eventType: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  isLast: boolean;
}) {
  // Only handle known task event types
  if (!(eventType in eventConfig)) {
    return null;
  }

  const config = eventConfig[eventType as TaskEventType];
  const { Icon, iconClassName, label, toStatus } = config;
  const reworkReason = metadata?.reason as string | undefined;

  return (
    <div className="flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background",
            iconClassName
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-border mt-2 min-h-[2rem]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{label}</span>
          <TaskStatusBadge status={toStatus} showIcon={false} className="text-xs py-0" />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatTimestamp(timestamp)}
          <span className="mx-1.5">·</span>
          {formatRelativeTime(timestamp)}
        </p>
        {reworkReason && (
          <div className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            <span className="font-medium">Reason:</span> {reworkReason}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * TaskHistory displays a timeline of task state changes.
 *
 * Features:
 * - Visual timeline with icons for each event type
 * - Timestamps with relative time display
 * - Rework reasons displayed when applicable
 * - Loading skeleton while fetching
 * - Empty state for tasks with no history
 */
export function TaskHistory({ chainId, taskId, className }: TaskHistoryProps) {
  const { data: history, isLoading } = trpc.tasks.getHistory.useQuery(
    { chainId, taskId },
    { enabled: !!chainId && !!taskId }
  );

  if (isLoading) {
    return (
      <div className={className}>
        <TaskHistorySkeleton />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className={className}>
        <TaskHistoryEmpty />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-0">
        {history.map((entry, index) => (
          <HistoryEntry
            key={entry.id}
            eventType={entry.eventType}
            timestamp={entry.timestamp}
            metadata={entry.metadata}
            isLast={index === history.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
