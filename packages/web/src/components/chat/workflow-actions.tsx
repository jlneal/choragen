// ADR: ADR-011-web-api-architecture
"use client";

import { useMemo, useState } from "react";
import type { WorkflowStatus } from "@choragen/core";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import { CancelDialog } from "./cancel-dialog";
import { Button } from "@/components/ui/button";

interface WorkflowActionsProps {
  workflowId: string;
  status?: WorkflowStatus | string;
  onCancelled?: () => void;
  className?: string;
}

const CANCELLABLE_STATUS: WorkflowStatus = "active";
const PAUSABLE_STATUS: WorkflowStatus = "active";
const RESUMABLE_STATUS: WorkflowStatus = "paused";

export function WorkflowActions({ workflowId, status, onCancelled, className }: WorkflowActionsProps) {
  const [open, setOpen] = useState(false);
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
