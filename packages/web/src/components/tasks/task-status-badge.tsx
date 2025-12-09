// ADR: ADR-011-web-api-architecture

import {
  Circle,
  CircleDot,
  Play,
  Eye,
  CheckCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Valid task status values
 */
export type TaskStatus =
  | "backlog"
  | "todo"
  | "in-progress"
  | "in-review"
  | "done"
  | "blocked";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
  /** Show icon alongside label */
  showIcon?: boolean;
}

/**
 * Status badge styling and icon configuration
 */
const statusConfig: Record<
  TaskStatus,
  { label: string; className: string; Icon: LucideIcon }
> = {
  backlog: {
    label: "Backlog",
    className:
      "bg-slate-100 text-slate-700 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-300",
    Icon: Circle,
  },
  todo: {
    label: "Todo",
    className:
      "bg-blue-100 text-blue-700 hover:bg-blue-100/80 dark:bg-blue-900 dark:text-blue-300",
    Icon: CircleDot,
  },
  "in-progress": {
    label: "In Progress",
    className:
      "bg-amber-100 text-amber-700 hover:bg-amber-100/80 dark:bg-amber-900 dark:text-amber-300",
    Icon: Play,
  },
  "in-review": {
    label: "In Review",
    className:
      "bg-purple-100 text-purple-700 hover:bg-purple-100/80 dark:bg-purple-900 dark:text-purple-300",
    Icon: Eye,
  },
  done: {
    label: "Done",
    className:
      "bg-green-100 text-green-700 hover:bg-green-100/80 dark:bg-green-900 dark:text-green-300",
    Icon: CheckCircle,
  },
  blocked: {
    label: "Blocked",
    className:
      "bg-red-100 text-red-700 hover:bg-red-100/80 dark:bg-red-900 dark:text-red-300",
    Icon: XCircle,
  },
};

/**
 * TaskStatusBadge displays the current status of a task
 * with appropriate color coding and optional icon for quick visual identification.
 */
export function TaskStatusBadge({
  status,
  className,
  showIcon = true,
}: TaskStatusBadgeProps) {
  const config = statusConfig[status];
  const { Icon } = config;

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium gap-1.5",
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
