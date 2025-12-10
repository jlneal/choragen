// ADR: ADR-011-web-api-architecture
"use client";

import { useState } from "react";
import {
  Play,
  CheckCircle,
  Ban,
  RotateCcw,
  Unlock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "./task-status-badge";

/**
 * Action configuration for each status transition
 */
interface ActionConfig {
  /** Display label */
  label: string;
  /** Icon component */
  Icon: React.ComponentType<{ className?: string }>;
  /** Button variant */
  variant: "default" | "secondary" | "destructive" | "outline";
  /** tRPC mutation key */
  mutationKey: "start" | "complete" | "approve" | "rework" | "block" | "unblock";
  /** Success message */
  successMessage: string;
}

/**
 * Map of status to available actions
 */
const statusActions: Record<TaskStatus, ActionConfig[]> = {
  backlog: [],
  todo: [
    {
      label: "Start",
      Icon: Play,
      variant: "default",
      mutationKey: "start",
      successMessage: "Task started",
    },
  ],
  "in-progress": [
    {
      label: "Complete",
      Icon: CheckCircle,
      variant: "default",
      mutationKey: "complete",
      successMessage: "Task marked for review",
    },
    {
      label: "Block",
      Icon: Ban,
      variant: "destructive",
      mutationKey: "block",
      successMessage: "Task blocked",
    },
  ],
  "in-review": [
    {
      label: "Approve",
      Icon: CheckCircle,
      variant: "default",
      mutationKey: "approve",
      successMessage: "Task approved",
    },
    {
      label: "Rework",
      Icon: RotateCcw,
      variant: "secondary",
      mutationKey: "rework",
      successMessage: "Task sent back for rework",
    },
  ],
  blocked: [
    {
      label: "Unblock",
      Icon: Unlock,
      variant: "default",
      mutationKey: "unblock",
      successMessage: "Task unblocked",
    },
  ],
  done: [],
};

interface TaskActionsProps {
  /** Chain ID containing the task */
  chainId: string;
  /** Task ID to perform actions on */
  taskId: string;
  /** Current task status */
  status: TaskStatus;
  /** Callback when an action completes successfully */
  onSuccess?: () => void;
  /** Callback when rework action is clicked (to open dialog instead of immediate action) */
  onReworkClick?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * TaskActions displays available state transitions as a button group
 * based on the current task status.
 *
 * Status transitions:
 * - todo → Start → in-progress
 * - in-progress → Complete → in-review, Block → blocked
 * - in-review → Approve → done, Rework → in-progress
 * - blocked → Unblock → todo
 * - done → (no actions)
 */
export function TaskActions({
  chainId,
  taskId,
  status,
  onSuccess,
  onReworkClick,
  className,
}: TaskActionsProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const utils = trpc.useUtils();

  // Define all mutations
  const startMutation = trpc.tasks.start.useMutation();
  const completeMutation = trpc.tasks.complete.useMutation();
  const approveMutation = trpc.tasks.approve.useMutation();
  const reworkMutation = trpc.tasks.rework.useMutation();
  const blockMutation = trpc.tasks.block.useMutation();
  const unblockMutation = trpc.tasks.unblock.useMutation();

  // Map mutation keys to mutation objects
  const mutations = {
    start: startMutation,
    complete: completeMutation,
    approve: approveMutation,
    rework: reworkMutation,
    block: blockMutation,
    unblock: unblockMutation,
  };

  const actions = statusActions[status];

  // No actions available for this status
  if (actions.length === 0) {
    return null;
  }

  const handleAction = async (action: ActionConfig) => {
    // If rework action and onReworkClick is provided, delegate to parent
    if (action.mutationKey === "rework" && onReworkClick) {
      onReworkClick();
      return;
    }

    setLoadingAction(action.mutationKey);

    const mutation = mutations[action.mutationKey];

    try {
      // Special handling for rework mutation which has a different input shape
      if (action.mutationKey === "rework") {
        await reworkMutation.mutateAsync({ chainId, taskId });
      } else {
        await mutation.mutateAsync({ chainId, taskId });
      }

      // Invalidate relevant queries
      utils.tasks.get.invalidate({ chainId, taskId });
      utils.tasks.listForChain.invalidate(chainId);
      utils.chains.get.invalidate(chainId);
      utils.chains.getSummary.invalidate(chainId);

      toast.success(action.successMessage);
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Action failed";
      toast.error(`Failed to ${action.label.toLowerCase()} task`, {
        description: message,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const isLoading = loadingAction !== null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {actions.map((action) => {
        const isActionLoading = loadingAction === action.mutationKey;
        const { Icon } = action;

        return (
          <Button
            key={action.mutationKey}
            variant={action.variant}
            size="sm"
            onClick={() => handleAction(action)}
            disabled={isLoading}
          >
            {isActionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
