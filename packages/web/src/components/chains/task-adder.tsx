// ADR: ADR-011-web-api-architecture
"use client";

import { useState } from "react";
import { Plus, Loader2, ChevronDown, ChevronUp, X } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Form field error state
 */
interface FormErrors {
  slug?: string;
  title?: string;
  description?: string;
}

interface TaskAdderProps {
  /** Chain ID to add the task to */
  chainId: string;
  /** Callback when task is successfully added */
  onSuccess?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * TaskAdder provides a compact quick-add form for adding tasks to a chain.
 *
 * Features:
 * - Required fields: slug, title, description
 * - Optional fields: expectedFiles, acceptance criteria, constraints
 * - Collapsible optional fields section
 * - Form validation before submission
 * - Loading state during submission
 * - Success toast and form reset on completion
 * - Invalidates task list query to show new task
 */
export function TaskAdder({ chainId, onSuccess, className }: TaskAdderProps) {
  const utils = trpc.useUtils();

  // Form state - required fields
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Form state - optional fields
  const [showOptional, setShowOptional] = useState(false);
  const [expectedFiles, setExpectedFiles] = useState("");
  const [acceptance, setAcceptance] = useState("");
  const [constraints, setConstraints] = useState("");

  // Validation state
  const [errors, setErrors] = useState<FormErrors>({});

  // Add task mutation
  const addTaskMutation = trpc.chains.addTask.useMutation({
    onSuccess: (result) => {
      // Invalidate chain query to refresh task list
      utils.chains.get.invalidate(chainId);
      utils.chains.getSummary.invalidate(chainId);
      utils.chains.list.invalidate();

      // Show success toast
      toast.success("Task added", {
        description: `Task "${result.title}" has been added to the chain.`,
      });

      // Reset form
      resetForm();

      // Call success callback
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to add task", {
        description: error.message,
      });
    },
  });

  // Reset form to initial state
  const resetForm = () => {
    setSlug("");
    setTitle("");
    setDescription("");
    setExpectedFiles("");
    setAcceptance("");
    setConstraints("");
    setShowOptional(false);
    setErrors({});
  };

  // Parse multi-line text into array
  const parseLines = (text: string): string[] => {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!slug.trim()) {
      newErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9-]+$/.test(slug.trim())) {
      newErrors.slug = "Slug must be lowercase letters, numbers, and hyphens only";
    }

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const expectedFilesArray = parseLines(expectedFiles);
    const acceptanceArray = parseLines(acceptance);
    const constraintsArray = parseLines(constraints);

    addTaskMutation.mutate({
      chainId,
      slug: slug.trim(),
      title: title.trim(),
      description: description.trim(),
      expectedFiles: expectedFilesArray.length > 0 ? expectedFilesArray : undefined,
      acceptance: acceptanceArray.length > 0 ? acceptanceArray : undefined,
      constraints: constraintsArray.length > 0 ? constraintsArray : undefined,
    });
  };

  const isPending = addTaskMutation.isPending;

  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Add Task</h3>
        </div>

        {/* Required fields - compact layout */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Slug */}
          <div className="space-y-1">
            <label htmlFor="task-slug" className="text-xs font-medium text-muted-foreground">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              id="task-slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value.toLowerCase());
                if (errors.slug) setErrors((prev) => ({ ...prev, slug: undefined }));
              }}
              placeholder="setup-database"
              disabled={isPending}
              className={cn(
                "w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background",
                errors.slug ? "border-red-500" : "border-input"
              )}
            />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label htmlFor="task-title" className="text-xs font-medium text-muted-foreground">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="Set up database schema"
              disabled={isPending}
              className={cn(
                "w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background",
                errors.title ? "border-red-500" : "border-input"
              )}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label htmlFor="task-description" className="text-xs font-medium text-muted-foreground">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            placeholder="Describe what this task should accomplish..."
            disabled={isPending}
            rows={2}
            className={cn(
              "w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none",
              errors.description ? "border-red-500" : "border-input"
            )}
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
        </div>

        {/* Optional fields toggle */}
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showOptional ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          {showOptional ? "Hide" : "Show"} optional fields
        </button>

        {/* Optional fields */}
        {showOptional && (
          <div className="space-y-3 pt-2 border-t">
            {/* Expected Files */}
            <div className="space-y-1">
              <label htmlFor="task-files" className="text-xs font-medium text-muted-foreground">
                Expected Files
              </label>
              <textarea
                id="task-files"
                value={expectedFiles}
                onChange={(e) => setExpectedFiles(e.target.value)}
                placeholder="One file path per line, e.g.&#10;src/lib/database.ts&#10;src/types/schema.ts"
                disabled={isPending}
                rows={2}
                className="w-full rounded-md border border-input px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none font-mono text-xs"
              />
            </div>

            {/* Acceptance Criteria */}
            <div className="space-y-1">
              <label htmlFor="task-acceptance" className="text-xs font-medium text-muted-foreground">
                Acceptance Criteria
              </label>
              <textarea
                id="task-acceptance"
                value={acceptance}
                onChange={(e) => setAcceptance(e.target.value)}
                placeholder="One criterion per line, e.g.&#10;Database connection works&#10;Schema migrations run successfully"
                disabled={isPending}
                rows={2}
                className="w-full rounded-md border border-input px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none"
              />
            </div>

            {/* Constraints */}
            <div className="space-y-1">
              <label htmlFor="task-constraints" className="text-xs font-medium text-muted-foreground">
                Constraints
              </label>
              <textarea
                id="task-constraints"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="One constraint per line, e.g.&#10;Must use PostgreSQL&#10;No ORM, raw SQL only"
                disabled={isPending}
                rows={2}
                className="w-full rounded-md border border-input px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {(slug || title || description || expectedFiles || acceptance || constraints) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetForm}
              disabled={isPending}
              className="h-8"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
          <Button type="submit" size="sm" disabled={isPending} className="h-8">
            {isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 mr-1" />
                Add Task
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
