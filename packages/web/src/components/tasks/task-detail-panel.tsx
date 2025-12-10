"use client";

// ADR: ADR-011-web-api-architecture

/**
 * TaskDetailPanel - Slide-out panel for viewing task details
 *
 * Displays full task information including description, expected files,
 * acceptance criteria, constraints, and notes.
 */

import { useState } from "react";
import {
  FileCode,
  CheckSquare,
  AlertTriangle,
  StickyNote,
  Pencil,
  History,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { TaskEditor, type TaskEditorData } from "@/components/chains";

import { TaskStatusBadge, type TaskStatus } from "./task-status-badge";
import { TaskActions } from "./task-actions";
import { ReworkDialog } from "./rework-dialog";
import { TaskHistory } from "./task-history";

interface TaskDetailPanelProps {
  /** Chain ID of the task to display */
  chainId: string | null;
  /** Task ID to display */
  taskId: string | null;
  /** Whether the panel is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * Loading skeleton for the task detail panel
 */
function TaskDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Status */}
      <Skeleton className="h-6 w-24" />

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-20 w-full" />
      </div>

      {/* Expected Files */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Acceptance Criteria */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

/**
 * Section component for consistent styling
 */
function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * TaskDetailPanel displays full task information in a slide-out sheet.
 *
 * Features:
 * - Slides in from the right
 * - Shows title, description, status
 * - Lists expected files
 * - Shows acceptance criteria as checklist
 * - Displays constraints and notes
 * - Loading state while fetching
 * - Closes on X button or outside click
 */
export function TaskDetailPanel({
  chainId,
  taskId,
  open,
  onOpenChange,
}: TaskDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [isReworkDialogOpen, setIsReworkDialogOpen] = useState(false);
  const utils = trpc.useUtils();

  // Fetch task details when panel is open and IDs are provided
  const { data: task, isLoading } = trpc.tasks.get.useQuery(
    { chainId: chainId!, taskId: taskId! },
    {
      enabled: open && !!chainId && !!taskId,
    }
  );

  // Reset state when panel closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsEditing(false);
      setIsHistoryExpanded(false);
    }
    onOpenChange(newOpen);
  };

  // Handle successful edit
  const handleEditSuccess = () => {
    // Invalidate queries to refresh data
    if (chainId) {
      utils.tasks.listForChain.invalidate(chainId);
      utils.chains.get.invalidate(chainId);
      utils.chains.getSummary.invalidate(chainId);
    }
    setIsEditing(false);
  };

  // Handle successful action (start, complete, approve, etc.)
  const handleActionSuccess = () => {
    // Queries are invalidated by TaskActions internally
  };

  // Handle rework action - opens the dialog instead of immediate action
  const handleReworkClick = () => {
    setIsReworkDialogOpen(true);
  };

  // Handle successful rework
  const handleReworkSuccess = () => {
    setIsReworkDialogOpen(false);
  };

  // Prepare task data for editor
  const taskEditorData: TaskEditorData | null = task
    ? {
        id: task.id,
        title: task.title,
        description: task.description,
        acceptance: task.acceptance,
      }
    : null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <SheetTitle className="text-lg font-semibold">
                {isLoading ? (
                  <Skeleton className="h-6 w-48" />
                ) : isEditing ? (
                  "Edit Task"
                ) : (
                  task?.title ?? "Task Details"
                )}
              </SheetTitle>
              <SheetDescription className="font-mono text-xs">
                {isLoading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  task?.id ?? ""
                )}
              </SheetDescription>
            </div>
            {!isLoading && task && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex-shrink-0"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="h-[calc(100vh-8rem)] mt-6 pr-4 overflow-y-auto">
          {isLoading ? (
            <TaskDetailSkeleton />
          ) : task && isEditing && chainId && taskEditorData ? (
            /* Edit Mode */
            <div className="space-y-4">
              <TaskEditor
                chainId={chainId}
                task={taskEditorData}
                onSuccess={handleEditSuccess}
              />
              <div className="border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel Editing
                </Button>
              </div>
            </div>
          ) : task ? (
            <div className="space-y-6">
              {/* Status Badge and Actions */}
              <div className="space-y-3">
                <TaskStatusBadge status={task.status} showIcon />
                {chainId && (
                  <TaskActions
                    chainId={chainId}
                    taskId={task.id}
                    status={task.status as TaskStatus}
                    onSuccess={handleActionSuccess}
                    onReworkClick={
                      task.status === "in-review" ? handleReworkClick : undefined
                    }
                  />
                )}
              </div>

              {/* Description */}
              {task.description && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Description
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}

              {/* Expected Files */}
              {task.expectedFiles && task.expectedFiles.length > 0 && (
                <Section title="Expected Files" icon={FileCode}>
                  <ul className="space-y-1">
                    {task.expectedFiles.map((file, index) => (
                      <li
                        key={index}
                        className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded"
                      >
                        {file}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Acceptance Criteria */}
              {task.acceptance && task.acceptance.length > 0 && (
                <Section title="Acceptance Criteria" icon={CheckSquare}>
                  <ul className="space-y-2">
                    {task.acceptance.map((criterion, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="mt-0.5 h-4 w-4 rounded border border-muted-foreground/30 flex-shrink-0" />
                        <span>{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Constraints */}
              {task.constraints && task.constraints.length > 0 && (
                <Section title="Constraints" icon={AlertTriangle}>
                  <ul className="space-y-1">
                    {task.constraints.map((constraint, index) => (
                      <li
                        key={index}
                        className="text-sm text-amber-600 dark:text-amber-400"
                      >
                        {constraint}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Notes */}
              {task.notes && (
                <Section title="Notes" icon={StickyNote}>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {task.notes}
                  </p>
                </Section>
              )}

              {/* Rework Info */}
              {task.reworkOf && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Rework Information
                  </h3>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Original task:</span>{" "}
                      <span className="font-mono">{task.reworkOf}</span>
                    </p>
                    {task.reworkReason && (
                      <p>
                        <span className="text-muted-foreground">Reason:</span>{" "}
                        {task.reworkReason}
                      </p>
                    )}
                    {task.reworkCount !== undefined && task.reworkCount > 0 && (
                      <p>
                        <span className="text-muted-foreground">Rework count:</span>{" "}
                        {task.reworkCount}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Task History - Collapsible */}
              {chainId && (
                <div className="border-t pt-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    className="flex items-center gap-2 w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isHistoryExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <History className="h-4 w-4" />
                    Task History
                  </button>
                  {isHistoryExpanded && (
                    <div className="mt-4">
                      <TaskHistory chainId={chainId} taskId={task.id} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No task selected
            </div>
          )}
        </div>

        {/* Rework Dialog */}
        {chainId && taskId && task && (
          <ReworkDialog
            isOpen={isReworkDialogOpen}
            onClose={() => setIsReworkDialogOpen(false)}
            chainId={chainId}
            taskId={taskId}
            taskTitle={task.title}
            onSuccess={handleReworkSuccess}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
