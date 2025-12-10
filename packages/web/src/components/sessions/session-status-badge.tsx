// ADR: ADR-011-web-api-architecture

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Valid session status values
 */
export type SessionStatus = "running" | "paused" | "completed" | "failed";

interface SessionStatusBadgeProps {
  status: SessionStatus;
  className?: string;
}

/**
 * Status badge styling configuration
 */
const statusConfig: Record<
  SessionStatus,
  { label: string; className: string }
> = {
  running: {
    label: "Running",
    className: "bg-green-100 text-green-700 hover:bg-green-100/80 dark:bg-green-900 dark:text-green-300",
  },
  paused: {
    label: "Paused",
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 dark:bg-yellow-900 dark:text-yellow-300",
  },
  completed: {
    label: "Completed",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-300",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700 hover:bg-red-100/80 dark:bg-red-900 dark:text-red-300",
  },
};

/**
 * SessionStatusBadge displays the current status of an agent session
 * with appropriate color coding for quick visual identification.
 */
export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
