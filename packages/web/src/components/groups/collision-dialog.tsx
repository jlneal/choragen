// ADR: ADR-011-web-api-architecture
"use client";

import { useState } from "react";
import { AlertTriangle, FolderPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Collision information for a request already in a group
 */
export interface Collision {
  requestId: string;
  currentGroupId: string;
  currentGroupName: string;
}

/**
 * Collision strategy options
 */
export type CollisionStrategy = "move-all" | "keep-existing" | "manual";

/**
 * Manual selection for a collision request
 */
export interface ManualSelection {
  requestId: string;
  moveToNew: boolean;
}

interface CollisionDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** The tag being converted to a group */
  tag: string;
  /** Total number of requests with this tag */
  totalRequests: number;
  /** Requests that are already in other groups */
  collisions: Collision[];
  /** Callback when user confirms with a strategy */
  onConfirm: (strategy: CollisionStrategy, manualSelections?: ManualSelection[]) => void;
  /** Whether the operation is pending */
  isPending?: boolean;
}

/**
 * CollisionDialog handles the UI for resolving conflicts when creating
 * a group from a tag where some requests are already in other groups.
 */
export function CollisionDialog({
  isOpen,
  onClose,
  tag,
  totalRequests,
  collisions,
  onConfirm,
  isPending = false,
}: CollisionDialogProps) {
  const [strategy, setStrategy] = useState<CollisionStrategy>("move-all");
  const [manualSelections, setManualSelections] = useState<Record<string, boolean>>(() => {
    // Default all collisions to move to new group
    const initial: Record<string, boolean> = {};
    collisions.forEach((c) => {
      initial[c.requestId] = true;
    });
    return initial;
  });

  const handleConfirm = () => {
    if (strategy === "manual") {
      const selections: ManualSelection[] = collisions.map((c) => ({
        requestId: c.requestId,
        moveToNew: manualSelections[c.requestId] ?? true,
      }));
      onConfirm(strategy, selections);
    } else {
      onConfirm(strategy);
    }
  };

  const handleClose = () => {
    if (!isPending) {
      onClose();
    }
  };

  const nonCollisionCount = totalRequests - collisions.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Create Group from Tag
          </DialogTitle>
          <DialogDescription>
            Create a new group &quot;{tag}&quot; from {totalRequests} tagged request{totalRequests !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Collision warning */}
          <div className="flex items-start gap-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                {collisions.length} request{collisions.length !== 1 ? "s" : ""} already in other groups
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                Choose how to handle these requests.
              </p>
            </div>
          </div>

          {/* Strategy selection */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="strategy"
                value="move-all"
                checked={strategy === "move-all"}
                onChange={() => setStrategy("move-all")}
                className="mt-1"
                disabled={isPending}
              />
              <div>
                <p className="font-medium">Move all to new group</p>
                <p className="text-sm text-muted-foreground">
                  All {totalRequests} requests will be in the new group. Collisions will be removed from their current groups.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="strategy"
                value="keep-existing"
                checked={strategy === "keep-existing"}
                onChange={() => setStrategy("keep-existing")}
                className="mt-1"
                disabled={isPending}
              />
              <div>
                <p className="font-medium">Keep in existing groups</p>
                <p className="text-sm text-muted-foreground">
                  Only {nonCollisionCount} request{nonCollisionCount !== 1 ? "s" : ""} will be added. Collisions stay in their current groups.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="strategy"
                value="manual"
                checked={strategy === "manual"}
                onChange={() => setStrategy("manual")}
                className="mt-1"
                disabled={isPending}
              />
              <div>
                <p className="font-medium">Choose individually</p>
                <p className="text-sm text-muted-foreground">
                  Select which collision requests to move to the new group.
                </p>
              </div>
            </label>
          </div>

          {/* Manual selection list */}
          {strategy === "manual" && (
            <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
              <p className="text-sm font-medium mb-2">Select requests to move:</p>
              {collisions.map((collision) => (
                <label
                  key={collision.requestId}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={manualSelections[collision.requestId] ?? true}
                    onCheckedChange={(checked: boolean | "indeterminate") => {
                      setManualSelections((prev) => ({
                        ...prev,
                        [collision.requestId]: checked === true,
                      }));
                    }}
                    disabled={isPending}
                  />
                  <span className="font-mono text-xs">{collision.requestId}</span>
                  <span className="text-muted-foreground">
                    (currently in &quot;{collision.currentGroupName}&quot;)
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Creating..." : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
