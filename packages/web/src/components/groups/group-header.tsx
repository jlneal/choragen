// ADR: ADR-011-web-api-architecture
"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface GroupHeaderProps {
  /** Group ID */
  groupId: string;
  /** Group name */
  name: string;
  /** Number of requests in the group */
  requestCount: number;
  /** Whether the group is expanded */
  isExpanded: boolean;
  /** Callback to toggle expansion */
  onToggleExpand: () => void;
  /** Callback to move the group up */
  onMoveUp?: () => void;
  /** Callback to move the group down */
  onMoveDown?: () => void;
  /** Callback to rename the group */
  onRename: (newName: string) => void;
  /** Callback to delete the group */
  onDelete: () => void;
  /** Whether the group can be moved up */
  canMoveUp?: boolean;
  /** Whether the group can be moved down */
  canMoveDown?: boolean;
  /** Whether an action is pending */
  isActionPending?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * GroupHeader displays the header for a group card.
 * Includes expand/collapse, name, count, move controls, and actions menu.
 */
export function GroupHeader({
  name,
  requestCount,
  isExpanded,
  onToggleExpand,
  onMoveUp,
  onMoveDown,
  onRename,
  onDelete,
  canMoveUp = true,
  canMoveDown = true,
  isActionPending = false,
  className,
}: GroupHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);

  const handleSubmitRename = () => {
    if (editName.trim() && editName.trim() !== name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmitRename();
    } else if (e.key === "Escape") {
      setEditName(name);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-t-lg border-b border-purple-100 dark:border-purple-900",
        isActionPending && "opacity-50",
        className
      )}
    >
      {/* Expand/Collapse button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={onToggleExpand}
        disabled={isActionPending}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Group icon */}
      <FolderOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />

      {/* Group name (editable) */}
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleSubmitRename}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 text-sm font-medium bg-white dark:bg-gray-800 border rounded"
          autoFocus
        />
      ) : (
        <span className="flex-1 text-sm font-medium text-purple-900 dark:text-purple-100 truncate">
          {name}
        </span>
      )}

      {/* Request count badge */}
      <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded-full">
        {requestCount} {requestCount === 1 ? "request" : "requests"}
      </span>

      {/* Move controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onMoveUp}
          disabled={!canMoveUp || isActionPending}
          title="Move group up"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onMoveDown}
          disabled={!canMoveDown || isActionPending}
          title="Move group down"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            disabled={isActionPending}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="text-red-600 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
