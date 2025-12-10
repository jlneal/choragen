// ADR: ADR-011-web-api-architecture
"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ListTodo } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

import { TaskStatusBadge, type TaskStatus } from "@/components/tasks/task-status-badge";

/**
 * Task data for the sortable list
 */
export interface SortableTaskData {
  /** Task ID */
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

interface SortableTaskItemProps {
  task: SortableTaskData;
  /** Whether this row is currently selected */
  isSelected?: boolean;
  /** Click handler for selecting this task */
  onTaskClick?: (task: SortableTaskData) => void;
  /** Handler for delete button click */
  onDeleteClick: (task: SortableTaskData) => void;
  /** Whether drag is disabled */
  disabled?: boolean;
}

/**
 * SortableTaskItem wraps a task row with drag-and-drop functionality.
 */
function SortableTaskItem({
  task,
  isSelected = false,
  onTaskClick,
  onDeleteClick,
  disabled = false,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = () => {
    onTaskClick?.(task);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTaskClick?.(task);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteClick(task);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg border transition-colors",
        isDragging && "opacity-50 z-50",
        !disabled && "group"
      )}
    >
      {/* Drag handle */}
      {!disabled && (
        <button
          {...attributes}
          {...listeners}
          className={cn(
            "cursor-grab active:cursor-grabbing",
            "p-2 rounded-l-lg hover:bg-accent",
            "text-muted-foreground hover:text-foreground",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
          )}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}

      {/* Task content - clickable area */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex-1 flex items-center gap-4 px-4 py-3 transition-colors",
          "hover:bg-accent/50 cursor-pointer",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isSelected ? "bg-accent" : "bg-card",
          disabled && "pl-4"
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

      {/* Delete button */}
      {!disabled && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "flex-shrink-0 mr-2",
            "text-muted-foreground hover:text-destructive",
            "opacity-0 group-hover:opacity-100 transition-opacity"
          )}
          onClick={handleDeleteClick}
          aria-label={`Delete task ${task.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface TaskListProps {
  /** Chain ID for API calls */
  chainId: string;
  /** Tasks to display, ordered by sequence */
  tasks: SortableTaskData[];
  /** ID of currently selected task */
  selectedTaskId?: string;
  /** Callback when a task is clicked */
  onTaskClick?: (task: SortableTaskData) => void;
  /** Whether drag-and-drop is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * TaskList displays an ordered list of tasks within a chain.
 * Supports drag-and-drop reordering and task deletion with confirmation.
 */
export function TaskList({
  chainId,
  tasks,
  selectedTaskId,
  onTaskClick,
  disabled = false,
  className,
}: TaskListProps) {
  const [optimisticTasks, setOptimisticTasks] = useState<SortableTaskData[] | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<SortableTaskData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const utils = trpc.useUtils();

  const reorderMutation = trpc.chains.reorderTasks.useMutation({
    onMutate: async ({ taskIds }) => {
      // Cancel outgoing refetches
      await utils.chains.get.cancel(chainId);

      // Snapshot current tasks
      const previousTasks = tasks;

      // Optimistically update the order
      const reorderedTasks = taskIds
        .map((id, index) => {
          const task = tasks.find((t) => t.id === id);
          return task ? { ...task, sequence: index + 1 } : null;
        })
        .filter((t): t is SortableTaskData => t !== null);

      setOptimisticTasks(reorderedTasks);

      return { previousTasks };
    },
    onError: (err, _variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        setOptimisticTasks(null);
      }
      toast.error("Failed to reorder tasks", {
        description: err.message,
      });
    },
    onSettled: () => {
      // Clear optimistic state and refetch
      setOptimisticTasks(null);
      utils.chains.get.invalidate(chainId);
    },
  });

  const deleteMutation = trpc.chains.deleteTask.useMutation({
    onSuccess: () => {
      utils.chains.get.invalidate(chainId);
      utils.chains.getSummary.invalidate(chainId);
      utils.tasks.listForChain.invalidate(chainId);
      toast.success("Task deleted", {
        description: "The task has been removed from the chain.",
      });
      setTaskToDelete(null);
    },
    onError: (err) => {
      toast.error("Failed to delete task", {
        description: err.message,
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const displayTasks = optimisticTasks ?? tasks;
    const oldIndex = displayTasks.findIndex((task) => task.id === active.id);
    const newIndex = displayTasks.findIndex((task) => task.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // Reorder and get new task IDs
      const reordered = arrayMove(displayTasks, oldIndex, newIndex);
      const taskIds = reordered.map((t) => t.id);

      reorderMutation.mutate({ chainId, taskIds });
    }
  };

  const handleDeleteClick = (task: SortableTaskData) => {
    setTaskToDelete(task);
  };

  const handleConfirmDelete = () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    deleteMutation.mutate({ chainId, taskId: taskToDelete.id });
  };

  const handleCancelDelete = () => {
    setTaskToDelete(null);
  };

  // Use optimistic tasks if available, otherwise use props
  const displayTasks = optimisticTasks ?? tasks;

  // Sort tasks by sequence for display
  const sortedTasks = [...displayTasks].sort((a, b) => a.sequence - b.sequence);

  if (sortedTasks.length === 0) {
    return <TaskListEmpty />;
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedTasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className={cn("space-y-2", className)}>
            {sortedTasks.map((task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                isSelected={task.id === selectedTaskId}
                onTaskClick={onTaskClick}
                onDeleteClick={handleDeleteClick}
                disabled={disabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Delete confirmation dialog */}
      <Dialog open={taskToDelete !== null} onOpenChange={(open) => !open && handleCancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the task &quot;{taskToDelete?.title}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
  const SKELETON_ITEMS = Array.from({ length: count });
  return (
    <div className={cn("space-y-2", className)}>
      {SKELETON_ITEMS.map((_, i) => (
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
      {/* Drag handle placeholder */}
      <Skeleton className="h-5 w-5 flex-shrink-0" />

      {/* Task number circle */}
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />

      {/* Task info */}
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Status badge */}
      <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />

      {/* Delete button placeholder */}
      <Skeleton className="h-9 w-9 flex-shrink-0" />
    </div>
  );
}
