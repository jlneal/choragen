// ADR: ADR-011-web-api-architecture
"use client";

import { useState } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
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
import { trpc } from "@/lib/trpc/client";

interface ReworkDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Chain ID containing the task */
  chainId: string;
  /** Task ID to send for rework */
  taskId: string;
  /** Task title for display */
  taskTitle?: string;
  /** Callback when rework succeeds */
  onSuccess?: () => void;
}

/**
 * ReworkDialog captures an optional reason when sending a task back for rework.
 *
 * Features:
 * - Text area for rework reason (optional but encouraged)
 * - Cancel and Send for Rework buttons
 * - Loading state during submission
 * - Closes on success, shows error on failure
 * - Keyboard accessible (Escape to close via Dialog primitive)
 */
export function ReworkDialog({
  isOpen,
  onClose,
  chainId,
  taskId,
  taskTitle,
  onSuccess,
}: ReworkDialogProps) {
  const [reason, setReason] = useState("");
  const utils = trpc.useUtils();

  const reworkMutation = trpc.tasks.rework.useMutation({
    onSuccess: () => {
      // Invalidate relevant queries
      utils.tasks.get.invalidate({ chainId, taskId });
      utils.tasks.listForChain.invalidate(chainId);
      utils.chains.get.invalidate(chainId);
      utils.chains.getSummary.invalidate(chainId);

      toast.success("Task sent back for rework");
      setReason("");
      onClose();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to send task for rework", {
        description: error.message,
      });
    },
  });

  const handleSubmit = () => {
    reworkMutation.mutate({
      chainId,
      taskId,
      reason: reason.trim() || undefined,
    });
  };

  const handleClose = () => {
    if (!reworkMutation.isPending) {
      setReason("");
      onClose();
    }
  };

  const isPending = reworkMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Send for Rework
          </DialogTitle>
          <DialogDescription>
            {taskTitle ? (
              <>Send &quot;{taskTitle}&quot; back for rework.</>
            ) : (
              <>Send this task back for rework.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label
            htmlFor="rework-reason"
            className="block text-sm font-medium mb-2"
          >
            Reason for rework{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="rework-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe what needs to be changed or fixed..."
            rows={4}
            disabled={isPending}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Providing a reason helps the implementer understand what changes are needed.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Send for Rework
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
