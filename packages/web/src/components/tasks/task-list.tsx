"use client";

// ADR: ADR-011-web-api-architecture

import { ListTodo } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { TaskRow, type TaskRowData } from "./task-row";

interface TaskListProps {
  /** Tasks to display, ordered by sequence */
  tasks: TaskRowData[];
  /** ID of currently selected task */
  selectedTaskId?: string;
  /** Callback when a task is clicked */
  onTaskClick?: (task: TaskRowData) => void;
  /** Additional class names */
  className?: string;
}

/**
 * TaskList displays an ordered list of tasks within a chain.
 * Supports task selection and click handling for detail panel.
 */
export function TaskList({
  tasks,
  selectedTaskId,
  onTaskClick,
  className,
}: TaskListProps) {
  if (tasks.length === 0) {
    return <TaskListEmpty />;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          isSelected={task.id === selectedTaskId}
          onClick={onTaskClick}
        />
      ))}
    </div>
  );
}

/**
 * Empty state when no tasks exist in the chain
 */
export function TaskListEmpty({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div className="rounded-full bg-muted p-3 mb-4">
        <ListTodo className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium">No tasks yet</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Tasks will appear here once they are added to the chain.
      </p>
    </div>
  );
}

/**
 * Loading skeleton for task list
 */
export function TaskListSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <TaskRowSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Loading skeleton for a single task row
 */
function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg border bg-card">
      {/* Task number circle */}
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />

      {/* Task info */}
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Status badge */}
      <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />
    </div>
  );
}
