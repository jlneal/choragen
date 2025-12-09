// ADR: ADR-011-web-api-architecture

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Valid chain/task status values
 */
export type ChainStatus =
  | "backlog"
  | "todo"
  | "in-progress"
  | "in-review"
  | "done"
  | "blocked";

interface ChainStatusBadgeProps {
  status: ChainStatus;
  className?: string;
}

/**
 * Status badge styling configuration
 */
const statusConfig: Record<
  ChainStatus,
  { label: string; className: string }
> = {
  backlog: {
    label: "Backlog",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-300",
  },
  todo: {
    label: "Todo",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100/80 dark:bg-blue-900 dark:text-blue-300",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100/80 dark:bg-amber-900 dark:text-amber-300",
  },
  "in-review": {
    label: "In Review",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100/80 dark:bg-purple-900 dark:text-purple-300",
  },
  done: {
    label: "Done",
    className: "bg-green-100 text-green-700 hover:bg-green-100/80 dark:bg-green-900 dark:text-green-300",
  },
  blocked: {
    label: "Blocked",
    className: "bg-red-100 text-red-700 hover:bg-red-100/80 dark:bg-red-900 dark:text-red-300",
  },
};

/**
 * ChainStatusBadge displays the current status of a chain or task
 * with appropriate color coding for quick visual identification.
 */
export function ChainStatusBadge({ status, className }: ChainStatusBadgeProps) {
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
