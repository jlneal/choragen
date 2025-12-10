// ADR: ADR-011-web-api-architecture
"use client";

import { useState } from "react";
import { Plus, FolderPlus, FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Group {
  id: string;
  name: string;
}

interface CreateGroupDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Callback when a group is created */
  onCreate: (name: string) => void;
  /** Whether creation is pending */
  isPending?: boolean;
}

/**
 * Simple inline dialog for creating a new group.
 */
function CreateGroupDialog({
  isOpen,
  onClose,
  onCreate,
  isPending = false,
}: CreateGroupDialogProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      setName("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 w-80">
        <h3 className="text-lg font-semibold mb-4">Create New Group</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Group name..."
            className="w-full px-3 py-2 border rounded-md mb-4 bg-transparent"
            autoFocus
            disabled={isPending}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                setName("");
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface GroupActionsProps {
  /** Available groups to add request to */
  groups: Group[];
  /** Callback to create a new group */
  onCreateGroup: (name: string) => void;
  /** Callback to add request to a group */
  onAddToGroup?: (groupId: string) => void;
  /** Current group ID if request is in a group */
  currentGroupId?: string | null;
  /** Whether creation is pending */
  isCreatePending?: boolean;
  /** Whether add is pending */
  isAddPending?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * GroupActions provides a dropdown menu for group-related actions.
 * Can be used to create groups or add requests to existing groups.
 */
export function GroupActions({
  groups,
  onCreateGroup,
  onAddToGroup,
  currentGroupId,
  isCreatePending = false,
  isAddPending = false,
  className,
}: GroupActionsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleCreateGroup = (name: string) => {
    onCreateGroup(name);
    setShowCreateDialog(false);
  };

  // Filter out current group from available groups
  const availableGroups = groups.filter((g) => g.id !== currentGroupId);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-1", className)}
            disabled={isAddPending}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Group
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Create New Group
          </DropdownMenuItem>

          {onAddToGroup && availableGroups.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Add to Group</DropdownMenuLabel>
              {availableGroups.map((group) => (
                <DropdownMenuItem
                  key={group.id}
                  onClick={() => onAddToGroup(group.id)}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  <span className="truncate">{group.name}</span>
                </DropdownMenuItem>
              ))}
            </>
          )}

          {onAddToGroup && availableGroups.length === 0 && groups.length === 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No groups yet
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateGroupDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreateGroup}
        isPending={isCreatePending}
      />
    </>
  );
}

interface CreateGroupButtonProps {
  /** Callback when a group is created */
  onCreate: (name: string) => void;
  /** Whether creation is pending */
  isPending?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Standalone button for creating a new group.
 */
export function CreateGroupButton({
  onCreate,
  isPending = false,
  className,
}: CreateGroupButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  const handleCreate = (name: string) => {
    onCreate(name);
    setShowDialog(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1", className)}
        onClick={() => setShowDialog(true)}
        disabled={isPending}
      >
        <Plus className="h-3.5 w-3.5" />
        New Group
      </Button>

      <CreateGroupDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onCreate={handleCreate}
        isPending={isPending}
      />
    </>
  );
}
