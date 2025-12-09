"use client";

// ADR: ADR-011-web-api-architecture

import { cn } from "@/lib/utils";

import { TaskStatusBadge, type TaskStatus } from "./task-status-badge";

/**
 * Task data for display in a row
 */
export interface TaskRowData {
  /** Task ID (e.g., "CHAIN-044-001-setup-api") */
  id: string;
  /** Sequence number in chain (1, 2, 3...) */
  sequence: number;
  /** Human-readable slug */
  slug: string;
  /** Task title */
  title: string;
  /** Current status */
  status: TaskStatus;
}

interface TaskRowProps {
  task: TaskRowData;
  /** Whether this row is currently selected */
  isSelected?: boolean;
  /** Click handler for selecting this task */
  onClick?: (task: TaskRowData) => void;
  /** Additional class names */
  className?: string;
}

/**
 * TaskRow displays a single task in a list format.
 * Shows task number, slug, title, and status badge.
 * Supports selection state and click handling for detail panel.
 */
export function TaskRow({
  task,
  isSelected = false,
  onClick,
  className,
}: TaskRowProps) {
  const handleClick = () => {
    onClick?.(task);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(task);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-lg border transition-colors",
        "hover:bg-accent/50 cursor-pointer",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isSelected
          ? "bg-accent border-accent-foreground/20"
          : "bg-card border-border",
        className
      )}
    >
      {/* Task number */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <span className="text-sm font-medium text-muted-foreground">
          {task.sequence}
        </span>
      </div>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-muted-foreground truncate">
            {task.slug}
          </span>
        </div>
        <p className="text-sm font-medium truncate mt-0.5">{task.title}</p>
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0">
        <TaskStatusBadge status={task.status} />
      </div>
    </div>
  );
}
