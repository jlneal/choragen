// ADR: ADR-011-web-api-architecture

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Valid request status values
 */
export type RequestStatus = "backlog" | "todo" | "doing" | "done";

interface RequestStatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

/**
 * Status badge styling configuration
 */
const statusConfig: Record<
  RequestStatus,
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
  doing: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100/80 dark:bg-amber-900 dark:text-amber-300",
  },
  done: {
    label: "Done",
    className: "bg-green-100 text-green-700 hover:bg-green-100/80 dark:bg-green-900 dark:text-green-300",
  },
};

/**
 * RequestStatusBadge displays the current status of a request
 * with appropriate color coding for quick visual identification.
 */
export function RequestStatusBadge({ status, className }: RequestStatusBadgeProps) {
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
