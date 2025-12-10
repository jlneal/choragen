// ADR: ADR-011-web-api-architecture
"use client";

import { useState } from "react";
import {
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Play,
  CheckCircle,
  RotateCcw,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "./request-status-badge";

interface RequestActionsProps {
  /** Request ID */
  requestId: string;
  /** Current status of the request */
  status: RequestStatus;
  /** Request title for display in dialogs */
  title: string;
  /** Callback when edit is requested */
  onEdit?: () => void;
  /** Callback after any action completes successfully */
  onActionComplete?: () => void;
  /** Callback after delete completes (for navigation) */
  onDelete?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * RequestActions provides a dropdown menu with status transitions and management actions.
 * Actions are status-aware and only show relevant options for the current state.
 */
export function RequestActions({
  requestId,
  status,
  title,
  onEdit,
  onActionComplete,
  onDelete,
  className,
}: RequestActionsProps) {
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");

  const utils = trpc.useUtils();

  // Mutations
  const promoteMutation = trpc.requests.promote.useMutation({
    onSuccess: () => {
      utils.requests.invalidate();
      onActionComplete?.();
    },
  });

  const demoteMutation = trpc.requests.demote.useMutation({
    onSuccess: () => {
      utils.requests.invalidate();
      onActionComplete?.();
    },
  });

  const updateStatusMutation = trpc.requests.updateStatus.useMutation({
    onSuccess: () => {
      utils.requests.invalidate();
      onActionComplete?.();
    },
  });

  const closeMutation = trpc.requests.close.useMutation({
    onSuccess: () => {
      utils.requests.invalidate();
      setShowCloseDialog(false);
      setCompletionNotes("");
      onActionComplete?.();
    },
  });

  const deleteMutation = trpc.requests.delete.useMutation({
    onSuccess: () => {
      utils.requests.invalidate();
      setShowDeleteDialog(false);
      onDelete?.();
      onActionComplete?.();
    },
  });

  const isLoading =
    promoteMutation.isPending ||
    demoteMutation.isPending ||
    updateStatusMutation.isPending ||
    closeMutation.isPending ||
    deleteMutation.isPending;

  // Action handlers
  const handlePromote = () => {
    promoteMutation.mutate({ requestId });
  };

  const handleDemote = () => {
    demoteMutation.mutate({ requestId });
  };

  const handleStartWork = () => {
    updateStatusMutation.mutate({ requestId, newStatus: "doing" });
  };

  const handleReopen = () => {
    updateStatusMutation.mutate({ requestId, newStatus: "todo" });
  };

  const handleClose = () => {
    if (completionNotes.trim()) {
      closeMutation.mutate({ requestId, completionNotes: completionNotes.trim() });
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate({ requestId });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", className)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Status-specific actions */}
          {status === "backlog" && (
            <DropdownMenuItem onClick={handlePromote} disabled={promoteMutation.isPending}>
              <ArrowUp className="h-4 w-4 mr-2" />
              Promote to Todo
            </DropdownMenuItem>
          )}

          {status === "todo" && (
            <>
              <DropdownMenuItem onClick={handleStartWork} disabled={updateStatusMutation.isPending}>
                <Play className="h-4 w-4 mr-2" />
                Start Work
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDemote} disabled={demoteMutation.isPending}>
                <ArrowDown className="h-4 w-4 mr-2" />
                Demote to Backlog
              </DropdownMenuItem>
            </>
          )}

          {status === "doing" && (
            <DropdownMenuItem onClick={() => setShowCloseDialog(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Close Request
            </DropdownMenuItem>
          )}

          {status === "done" && (
            <DropdownMenuItem onClick={handleReopen} disabled={updateStatusMutation.isPending}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reopen
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Edit action */}
          {onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}

          {/* Delete action */}
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Close Request Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Request</DialogTitle>
            <DialogDescription>
              Add completion notes for &quot;{title}&quot;. These notes will be added to the request
              document.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Describe what was implemented, any notable decisions, and verification performed..."
              className="w-full min-h-[120px] px-3 py-2 border rounded-md bg-transparent resize-y text-sm"
              autoFocus
              disabled={closeMutation.isPending}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCloseDialog(false);
                setCompletionNotes("");
              }}
              disabled={closeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClose}
              disabled={!completionNotes.trim() || closeMutation.isPending}
            >
              {closeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Closing...
                </>
              ) : (
                "Close Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
