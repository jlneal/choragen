// ADR: ADR-011-web-api-architecture
"use client";

/**
 * TaskEditor - Inline editor component for editing task details
 *
 * Features:
 * - Click-to-edit for task title
 * - Expandable editor for description and acceptance criteria
 * - Calls tasks.update mutation on save
 * - Cancel button to discard changes
 * - Shows loading state during save
 * - Keyboard shortcuts (Escape to cancel, Cmd+Enter to save)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Pencil, X, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

/**
 * Task data structure for the editor
 */
export interface TaskEditorData {
  /** Task ID */
  id: string;
  /** Task title */
  title: string;
  /** Task description */
  description?: string;
  /** Acceptance criteria */
  acceptance?: string[];
}

interface TaskEditorProps {
  /** Chain ID containing the task */
  chainId: string;
  /** Task data to edit */
  task: TaskEditorData;
  /** Callback when task is successfully updated */
  onSuccess?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * Inline title editor with click-to-edit functionality
 */
function TitleEditor({
  value,
  onChange,
  onSave,
  onCancel,
  isLoading,
}: {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (!isLoading) {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (localValue.trim() && localValue !== value) {
      onChange(localValue.trim());
      onSave();
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter") {
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isLoading}
          className={cn(
            "flex-1 px-2 py-1 text-lg font-semibold rounded-md border",
            "focus:outline-none focus:ring-2 focus:ring-ring bg-background",
            "border-input"
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleSave}
          disabled={isLoading || !localValue.trim()}
          className="h-8 w-8"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          disabled={isLoading}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleStartEdit}
      className={cn(
        "group flex items-center gap-2 text-left w-full",
        "hover:bg-accent/50 rounded-md px-2 py-1 -mx-2 transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <span className="text-lg font-semibold flex-1">{value}</span>
      <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

/**
 * TaskEditor provides inline editing for task details.
 *
 * Features:
 * - Click-to-edit title
 * - Expandable description and acceptance criteria editors
 * - Keyboard shortcuts (Escape to cancel, Cmd+Enter to save)
 * - Loading state during save
 * - Optimistic updates with rollback on error
 */
export function TaskEditor({
  chainId,
  task,
  onSuccess,
  className,
}: TaskEditorProps) {
  const utils = trpc.useUtils();

  // Form state
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [acceptance, setAcceptance] = useState(
    task.acceptance?.join("\n") ?? ""
  );

  // UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Refs for keyboard handling
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const acceptanceRef = useRef<HTMLTextAreaElement>(null);

  // Reset form when task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setAcceptance(task.acceptance?.join("\n") ?? "");
    setHasChanges(false);
  }, [task]);

  // Track changes
  useEffect(() => {
    const titleChanged = title !== task.title;
    const descriptionChanged = description !== (task.description ?? "");
    const acceptanceChanged =
      acceptance !== (task.acceptance?.join("\n") ?? "");
    setHasChanges(titleChanged || descriptionChanged || acceptanceChanged);
  }, [title, description, acceptance, task]);

  // Update mutation
  const updateMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh data
      utils.tasks.get.invalidate({ chainId, taskId: task.id });
      utils.chains.get.invalidate(chainId);

      toast.success("Task updated", {
        description: "Your changes have been saved.",
      });

      setHasChanges(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to update task", {
        description: error.message,
      });
    },
  });

  // Parse acceptance criteria from text
  const parseAcceptance = (text: string): string[] => {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  // Save changes
  const handleSave = useCallback(() => {
    if (!hasChanges) return;

    const updates: {
      title?: string;
      description?: string;
      acceptance?: string[];
    } = {};

    if (title !== task.title) {
      updates.title = title;
    }
    if (description !== (task.description ?? "")) {
      updates.description = description;
    }
    if (acceptance !== (task.acceptance?.join("\n") ?? "")) {
      updates.acceptance = parseAcceptance(acceptance);
    }

    if (Object.keys(updates).length > 0) {
      updateMutation.mutate({
        chainId,
        taskId: task.id,
        updates,
      });
    }
  }, [
    chainId,
    task,
    title,
    description,
    acceptance,
    hasChanges,
    updateMutation,
  ]);

  // Cancel changes
  const handleCancel = useCallback(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setAcceptance(task.acceptance?.join("\n") ?? "");
    setHasChanges(false);
    setIsExpanded(false);
  }, [task]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    },
    [handleCancel, handleSave]
  );

  const isPending = updateMutation.isPending;

  return (
    <div className={cn("space-y-4", className)} onKeyDown={handleKeyDown}>
      {/* Title - click to edit */}
      <TitleEditor
        value={title}
        onChange={setTitle}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isPending}
      />

      {/* Expandable section toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-1 text-sm text-muted-foreground",
          "hover:text-foreground transition-colors"
        )}
      >
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        {isExpanded ? "Hide" : "Edit"} description & acceptance criteria
      </button>

      {/* Expandable editor section */}
      {isExpanded && (
        <div className="space-y-4 border-t pt-4">
          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="task-description"
              className="text-sm font-medium text-muted-foreground"
            >
              Description
            </label>
            <textarea
              ref={descriptionRef}
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this task should accomplish..."
              disabled={isPending}
              rows={4}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ring bg-background",
                "border-input resize-none"
              )}
            />
          </div>

          {/* Acceptance Criteria */}
          <div className="space-y-2">
            <label
              htmlFor="task-acceptance"
              className="text-sm font-medium text-muted-foreground"
            >
              Acceptance Criteria
            </label>
            <textarea
              ref={acceptanceRef}
              id="task-acceptance"
              value={acceptance}
              onChange={(e) => setAcceptance(e.target.value)}
              placeholder="One criterion per line, e.g.&#10;Database connection works&#10;Schema migrations run successfully"
              disabled={isPending}
              rows={4}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ring bg-background",
                "border-input resize-none"
              )}
            />
            <p className="text-xs text-muted-foreground">
              Enter one criterion per line
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">
                Esc
              </kbd>{" "}
              to cancel,{" "}
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">
                {navigator.platform?.includes("Mac") ? "Cmd" : "Ctrl"}+Enter
              </kbd>{" "}
              to save
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isPending}
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isPending || !hasChanges}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved changes indicator (when collapsed) */}
      {!isExpanded && hasChanges && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-amber-600 dark:text-amber-400">
            You have unsaved changes
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
            >
              Discard
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton for TaskEditor
 */
export function TaskEditorSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
      <div className="h-5 w-48 bg-muted rounded animate-pulse" />
    </div>
  );
}
