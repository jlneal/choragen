// ADR: ADR-011-web-api-architecture

"use client";

/**
 * GitPanel Component
 *
 * Expandable panel showing changed files grouped by status:
 * - Staged files (with unstage action)
 * - Modified files (with stage action)
 * - Untracked files (with stage action)
 *
 * Supports multi-select for batch stage/unstage operations.
 */

import { useState, useCallback, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  File,
  FilePlus,
  FileEdit,
  Check,
  Plus,
  Minus,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

/** Polling interval for git status updates (ms) */
const POLL_INTERVAL_MS = 5000;

/**
 * File status type for categorization
 */
type FileStatus = "staged" | "modified" | "untracked";

/**
 * Props for the GitPanel component
 */
interface GitPanelProps {
  /** Additional class names */
  className?: string;
  /** Whether the panel starts expanded */
  defaultExpanded?: boolean;
}

/**
 * GitPanel displays changed files with stage/unstage actions.
 * Groups files by status with collapsible sections.
 */
export function GitPanel({ className, defaultExpanded = true }: GitPanelProps) {
  const [isPanelExpanded, setIsPanelExpanded] = useState(defaultExpanded);
  const [expandedSections, setExpandedSections] = useState<Set<FileStatus>>(
    new Set(["staged", "modified", "untracked"])
  );
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const utils = trpc.useUtils();

  const { data, isLoading, isError } = trpc.git.status.useQuery(undefined, {
    refetchInterval: POLL_INTERVAL_MS,
    placeholderData: (prev) => prev,
  });

  const stageMutation = trpc.git.stage.useMutation({
    onSuccess: () => {
      utils.git.status.invalidate();
      setSelectedFiles(new Set());
    },
  });

  const unstageMutation = trpc.git.unstage.useMutation({
    onSuccess: () => {
      utils.git.status.invalidate();
      setSelectedFiles(new Set());
    },
  });

  const toggleSection = useCallback((section: FileStatus) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const toggleFileSelection = useCallback((filePath: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  }, []);

  const selectAllInSection = useCallback(
    (files: string[]) => {
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        const allSelected = files.every((f) => prev.has(f));
        if (allSelected) {
          // Deselect all
          files.forEach((f) => next.delete(f));
        } else {
          // Select all
          files.forEach((f) => next.add(f));
        }
        return next;
      });
    },
    []
  );

  const handleStageSelected = useCallback(() => {
    if (!data) return;
    const filesToStage = [...selectedFiles].filter(
      (f) => data.modified.includes(f) || data.untracked.includes(f)
    );
    if (filesToStage.length > 0) {
      stageMutation.mutate({ files: filesToStage });
    }
  }, [data, selectedFiles, stageMutation]);

  const handleUnstageSelected = useCallback(() => {
    if (!data) return;
    const filesToUnstage = [...selectedFiles].filter((f) =>
      data.staged.includes(f)
    );
    if (filesToUnstage.length > 0) {
      unstageMutation.mutate({ files: filesToUnstage });
    }
  }, [data, selectedFiles, unstageMutation]);

  const handleStageFile = useCallback(
    (file: string) => {
      stageMutation.mutate({ files: [file] });
    },
    [stageMutation]
  );

  const handleUnstageFile = useCallback(
    (file: string) => {
      unstageMutation.mutate({ files: [file] });
    },
    [unstageMutation]
  );

  // Compute selection state for batch actions
  const selectionState = useMemo(() => {
    if (!data) return { canStage: false, canUnstage: false };
    const selectedArray = [...selectedFiles];
    const canStage = selectedArray.some(
      (f) => data.modified.includes(f) || data.untracked.includes(f)
    );
    const canUnstage = selectedArray.some((f) => data.staged.includes(f));
    return { canStage, canUnstage };
  }, [data, selectedFiles]);

  const isActionPending = stageMutation.isPending || unstageMutation.isPending;
  const totalChanges = data
    ? data.staged.length + data.modified.length + data.untracked.length
    : 0;

  if (isLoading) {
    return <GitPanelSkeleton className={className} />;
  }

  if (isError || !data) {
    return <GitPanelError className={className} />;
  }

  if (totalChanges === 0) {
    return (
      <Card className={cn("border-green-200 dark:border-green-800", className)}>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            Working directory clean
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader
        className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsPanelExpanded(!isPanelExpanded)}
      >
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPanelExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span>Changes</span>
            <span className="text-muted-foreground">({totalChanges})</span>
          </div>
          {isPanelExpanded && selectedFiles.size > 0 && (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {selectionState.canStage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleStageSelected}
                  disabled={isActionPending}
                >
                  {isActionPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  Stage
                </Button>
              )}
              {selectionState.canUnstage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleUnstageSelected}
                  disabled={isActionPending}
                >
                  {isActionPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  Unstage
                </Button>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>

      {isPanelExpanded && (
        <CardContent className="px-2 pb-3 pt-0 space-y-2">
          {/* Staged Files */}
          {data.staged.length > 0 && (
            <FileSection
              title="Staged"
              status="staged"
              files={data.staged}
              icon={<Check className="h-3.5 w-3.5 text-green-500" />}
              isExpanded={expandedSections.has("staged")}
              onToggle={() => toggleSection("staged")}
              selectedFiles={selectedFiles}
              onToggleFile={toggleFileSelection}
              onSelectAll={() => selectAllInSection(data.staged)}
              actionLabel="Unstage"
              actionIcon={<Minus className="h-3 w-3" />}
              onAction={handleUnstageFile}
              isActionPending={isActionPending}
              titleClassName="text-green-600 dark:text-green-400"
            />
          )}

          {/* Modified Files */}
          {data.modified.length > 0 && (
            <FileSection
              title="Modified"
              status="modified"
              files={data.modified}
              icon={<FileEdit className="h-3.5 w-3.5 text-amber-500" />}
              isExpanded={expandedSections.has("modified")}
              onToggle={() => toggleSection("modified")}
              selectedFiles={selectedFiles}
              onToggleFile={toggleFileSelection}
              onSelectAll={() => selectAllInSection(data.modified)}
              actionLabel="Stage"
              actionIcon={<Plus className="h-3 w-3" />}
              onAction={handleStageFile}
              isActionPending={isActionPending}
              titleClassName="text-amber-600 dark:text-amber-400"
            />
          )}

          {/* Untracked Files */}
          {data.untracked.length > 0 && (
            <FileSection
              title="Untracked"
              status="untracked"
              files={data.untracked}
              icon={<FilePlus className="h-3.5 w-3.5 text-muted-foreground" />}
              isExpanded={expandedSections.has("untracked")}
              onToggle={() => toggleSection("untracked")}
              selectedFiles={selectedFiles}
              onToggleFile={toggleFileSelection}
              onSelectAll={() => selectAllInSection(data.untracked)}
              actionLabel="Stage"
              actionIcon={<Plus className="h-3 w-3" />}
              onAction={handleStageFile}
              isActionPending={isActionPending}
              titleClassName="text-muted-foreground"
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Props for FileSection component
 */
interface FileSectionProps {
  title: string;
  status: FileStatus;
  files: string[];
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  selectedFiles: Set<string>;
  onToggleFile: (file: string) => void;
  onSelectAll: () => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  onAction: (file: string) => void;
  isActionPending: boolean;
  titleClassName?: string;
}

/**
 * FileSection displays a collapsible group of files with the same status.
 */
function FileSection({
  title,
  files,
  icon,
  isExpanded,
  onToggle,
  selectedFiles,
  onToggleFile,
  onSelectAll,
  actionLabel,
  actionIcon,
  onAction,
  isActionPending,
  titleClassName,
}: FileSectionProps) {
  const allSelected = files.every((f) => selectedFiles.has(f));
  const someSelected = files.some((f) => selectedFiles.has(f));

  return (
    <div className="rounded-md border">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        {icon}
        <span className={cn("text-xs font-medium flex-1", titleClassName)}>
          {title}
        </span>
        <span className="text-xs text-muted-foreground">{files.length}</span>
      </div>

      {isExpanded && (
        <div className="border-t">
          {/* Select all row */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 border-b cursor-pointer hover:bg-muted/50"
            onClick={(e) => {
              e.stopPropagation();
              onSelectAll();
            }}
          >
            <Checkbox
              checked={allSelected}
              className="h-3.5 w-3.5"
              data-state={
                allSelected ? "checked" : someSelected ? "indeterminate" : "unchecked"
              }
            />
            <span className="text-xs text-muted-foreground">
              {allSelected ? "Deselect all" : "Select all"}
            </span>
          </div>

          {/* File list */}
          {files.map((file) => (
            <FileRow
              key={file}
              file={file}
              isSelected={selectedFiles.has(file)}
              onToggleSelect={() => onToggleFile(file)}
              actionLabel={actionLabel}
              actionIcon={actionIcon}
              onAction={() => onAction(file)}
              isActionPending={isActionPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Props for FileRow component
 */
interface FileRowProps {
  file: string;
  isSelected: boolean;
  onToggleSelect: () => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  onAction: () => void;
  isActionPending: boolean;
}

/**
 * FileRow displays a single file with selection and action controls.
 */
function FileRow({
  file,
  isSelected,
  onToggleSelect,
  actionLabel,
  actionIcon,
  onAction,
  isActionPending,
}: FileRowProps) {
  // Extract filename and directory from path
  const lastSlash = file.lastIndexOf("/");
  const directory = lastSlash > 0 ? file.slice(0, lastSlash + 1) : "";
  const filename = lastSlash > 0 ? file.slice(lastSlash + 1) : file;

  return (
    <div className="group flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 transition-colors">
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelect}
        className="h-3.5 w-3.5"
        onClick={(e) => e.stopPropagation()}
      />
      <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0 text-xs">
        {directory && (
          <span className="text-muted-foreground">{directory}</span>
        )}
        <span className="font-medium">{filename}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onAction();
        }}
        disabled={isActionPending}
        title={actionLabel}
      >
        {isActionPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          actionIcon
        )}
      </Button>
    </div>
  );
}

/**
 * GitPanelSkeleton shows a loading placeholder.
 */
function GitPanelSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-3 pt-0 space-y-2">
        <div className="h-24 bg-muted rounded animate-pulse" />
        <div className="h-24 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

/**
 * GitPanelError shows when git status cannot be fetched.
 */
function GitPanelError({ className }: { className?: string }) {
  return (
    <Card className={cn("border-destructive/50", className)}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium text-destructive">
          Unable to fetch git status
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
