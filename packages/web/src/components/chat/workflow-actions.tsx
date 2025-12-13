// ADR: ADR-011-web-api-architecture
"use client";

import { useMemo, useState } from "react";
import type { StageGateOption, WorkflowStatus } from "@choragen/core";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import { CancelDialog } from "./cancel-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface WorkflowActionsProps {
  workflowId: string;
  status?: WorkflowStatus | string;
  stageIndex?: number;
  gateOptions?: StageGateOption[];
  onCancelled?: () => void;
  className?: string;
}

const CANCELLABLE_STATUS: WorkflowStatus = "active";
const PAUSABLE_STATUS: WorkflowStatus = "active";
const RESUMABLE_STATUS: WorkflowStatus = "paused";

export function WorkflowActions({ workflowId, status, stageIndex, gateOptions, onCancelled, className }: WorkflowActionsProps) {
  const [open, setOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [discardReason, setDiscardReason] = useState("");
  const utils = trpc.useUtils();

  const cancelMutation = trpc.workflow.cancel.useMutation({
    onSuccess: async () => {
      toast.success("Workflow cancelled");
      await utils.workflow.get.invalidate(workflowId);
      await utils.workflow.list.invalidate();
      await utils.workflow.getHistory.invalidate({ workflowId });
      onCancelled?.();
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to cancel workflow", {
        description: error.message,
      });
    },
  });

  const discardMutation = trpc.workflow.discard.useMutation({
    onSuccess: async () => {
      toast.success("Workflow discarded");
      await utils.workflow.get.invalidate(workflowId);
      await utils.workflow.list.invalidate();
      await utils.workflow.getHistory.invalidate({ workflowId });
      setDiscardOpen(false);
      setDiscardReason("");
    },
    onError: (error) => {
      toast.error("Failed to discard workflow", {
        description: error.message,
      });
    },
  });

  const pauseMutation = trpc.workflow.pause.useMutation({
    onSuccess: async () => {
      toast.success("Workflow paused");
      await utils.workflow.get.invalidate(workflowId);
      await utils.workflow.list.invalidate();
      await utils.workflow.getHistory.invalidate({ workflowId });
    },
    onError: (error) => {
      toast.error("Failed to pause workflow", {
        description: error.message,
      });
    },
  });

  const resumeMutation = trpc.workflow.resume.useMutation({
    onSuccess: async () => {
      toast.success("Workflow resumed");
      await utils.workflow.get.invalidate(workflowId);
      await utils.workflow.list.invalidate();
      await utils.workflow.getHistory.invalidate({ workflowId });
    },
    onError: (error) => {
      toast.error("Failed to resume workflow", {
        description: error.message,
      });
    },
  });

  const hasDiscardOption = gateOptions?.some((option) => option.action === "discard");

  const controls = useMemo(() => {
    if (status === PAUSABLE_STATUS) {
      return (
        <>
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => pauseMutation.mutate({ workflowId })}
            disabled={pauseMutation.isPending}
          >
            {pauseMutation.isPending ? "Pausing..." : "Pause"}
          </Button>
          <CancelDialog
            open={open}
            onOpenChange={setOpen}
            onConfirm={() => cancelMutation.mutate({ workflowId })}
            isSubmitting={cancelMutation.isPending}
          />
          {hasDiscardOption ? (
            <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="min-h-[44px] min-w-[44px]"
                  disabled={discardMutation.isPending}
                >
                  Discard idea
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Discard this idea?</DialogTitle>
                  <DialogDescription>
                    Provide a short reason. This will be logged to the workflow history.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="discard-reason">Reason</Label>
                  <Textarea
                    id="discard-reason"
                    value={discardReason}
                    onChange={(event) => setDiscardReason(event.target.value)}
                    placeholder="Summarize why the idea is being discarded"
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={() => discardMutation.mutate({ workflowId, reason: discardReason })}
                    disabled={discardMutation.isPending || discardReason.trim().length === 0}
                  >
                    {discardMutation.isPending ? "Discarding..." : "Confirm discard"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}
        </>
      );
    }

    if (status === RESUMABLE_STATUS) {
      return (
        <Button
          size="sm"
          className="min-h-[44px] min-w-[44px]"
          onClick={() => resumeMutation.mutate({ workflowId })}
          disabled={resumeMutation.isPending}
        >
          {resumeMutation.isPending ? "Resuming..." : "Resume"}
        </Button>
      );
    }

    return null;
  }, [status, pauseMutation, resumeMutation, open, workflowId, cancelMutation]);

  return (
    <div className={className}>{controls}</div>
  );
}
