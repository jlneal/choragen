// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useState } from "react";

import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface GatePromptProps {
  workflowId: string;
  stageIndex: number;
  prompt: string;
  gateType?: string;
}

export function GatePrompt({ workflowId, stageIndex, prompt, gateType }: GatePromptProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [discardReason, setDiscardReason] = useState("");
  const utils = trpc.useUtils();
  const { data: workflow } = trpc.workflow.get.useQuery(workflowId);
  const gateOptions = workflow?.stages?.[stageIndex]?.gate?.options ?? [];
  const advanceOption = gateOptions.find((option) => option.action === "advance");
  const discardOption = gateOptions.find((option) => option.action === "discard");

  const satisfyGate = trpc.workflow.satisfyGate.useMutation({
    onSuccess: () => {
      setStatusMessage("Gate approved");
    },
    onError: (error) => {
      setStatusMessage(error.message || "Failed to submit gate response");
    },
  });

  const invokeAgent = trpc.workflow.invokeAgent.useMutation({
    onSuccess: (session) => {
      setStatusMessage("Agent starting...");
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("agent-session-started", {
            detail: { sessionId: session.sessionId },
          })
        );
      }
    },
    onError: (error) => {
      setStatusMessage(error.message || "Failed to start agent");
    },
  });

  const discardMutation = trpc.workflow.discard.useMutation({
    onSuccess: () => {
      setStatusMessage("Idea discarded");
      setDiscardOpen(false);
      setDiscardReason("");
      utils.workflow.get.invalidate(workflowId);
      utils.workflow.list.invalidate();
      utils.workflow.getHistory.invalidate({ workflowId });
    },
    onError: (error) => {
      setStatusMessage(error.message || "Failed to discard");
    },
  });

  const isSubmitting = satisfyGate.isPending || invokeAgent.isPending;

  const handleApprove = async () => {
    setStatusMessage(null);
    try {
      await satisfyGate.mutateAsync({
        workflowId,
        stageIndex,
        satisfiedBy: "user",
      });
      await invokeAgent.mutateAsync({ workflowId });
      utils.workflow.get.invalidate(workflowId);
      utils.workflow.list.invalidate();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve gate";
      setStatusMessage(message);
    }
  };

  const handleDiscard = async () => {
    setStatusMessage(null);
    try {
      await discardMutation.mutateAsync({
        workflowId,
        reason: discardReason.trim(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to discard workflow";
      setStatusMessage(message);
    }
  };

  const handleReject = () => {
    setStatusMessage("Requested changes — implementation pending");
  };

  return (
    <div className="flex justify-center">
      <Card className="max-w-[720px] border-primary">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Approval Required
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              Stage {stageIndex + 1}
              {gateType ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-100">
                  {gateType}
                </Badge>
              ) : null}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-foreground">{prompt}</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button onClick={handleApprove} disabled={isSubmitting} size="sm">
              {isSubmitting ? "Submitting..." : advanceOption?.label ?? "Approve"}
            </Button>
            {discardOption ? (
              <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={discardMutation.isPending}>
                    {discardOption.label || "Discard"}
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
                      onClick={handleDiscard}
                      disabled={discardMutation.isPending || discardReason.trim().length === 0}
                    >
                      {discardMutation.isPending ? "Discarding..." : "Confirm discard"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Button variant="outline" onClick={handleReject} disabled={isSubmitting} size="sm">
                Request Changes
              </Button>
            )}
          </div>
          {statusMessage ? (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              {satisfyGate.error ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )}
              <span>{statusMessage}</span>
            </div>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}
