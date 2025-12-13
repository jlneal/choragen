// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

import type { StageGateOption, WorkflowMessage } from "@choragen/core";
import { ChatContainer } from "@/components/chat/chat-container";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowSidebar } from "@/components/chat/workflow-sidebar";
import { WorkflowActions } from "@/components/chat/workflow-actions";

const DEFAULT_STAGE_INDEX = 0;

/**
 * Summarize the current stage progress for display in the sidebar.
 */
export function deriveStageSummary(
  currentStage?: number,
  totalStages?: number
): string {
  if (typeof currentStage !== "number" || typeof totalStages !== "number" || totalStages <= 0) {
    return "No stages available";
  }

  const safeStage = Math.min(Math.max(currentStage, DEFAULT_STAGE_INDEX), totalStages - 1);
  const displayStage = safeStage + 1;

  return `Stage ${displayStage} of ${totalStages}`;
}

interface ChatWorkflowContentProps {
  workflowId: string;
}

export function ChatWorkflowContent({ workflowId }: ChatWorkflowContentProps) {
  const {
    data: workflow,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = trpc.workflow.get.useQuery(workflowId);

  const stageSummary = useMemo(
    () => deriveStageSummary(workflow?.currentStage, workflow?.stages?.length),
    [workflow?.currentStage, workflow?.stages?.length]
  );

  const normalizedMessages = useMemo(
    () => {
      if (!workflow?.messages) {
        return undefined;
      }

      return workflow.messages.map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp as unknown as string),
      }));
    },
    [workflow?.messages]
  );

  if (error?.data?.code === "NOT_FOUND") {
    return (
      <div className="space-y-4">
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to chat
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <CardTitle>Workflow not found</CardTitle>
              <CardDescription>
                No workflow exists with ID <span className="font-mono">{workflowId}</span>.
              </CardDescription>
            </div>
          </CardHeader>
          <CardFooter>
            <Button asChild size="sm" variant="outline">
              <Link href="/chat">View active workflows</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/chat"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to chat
      </Link>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          {isLoading ? (
            <SidebarSkeleton />
          ) : workflow ? (
            <WorkflowSidebar
              workflowId={workflow.id}
              requestId={workflow.requestId}
              status={workflow.status}
              template={workflow.template}
              stageSummary={stageSummary}
              updatedAt={workflow.updatedAt}
              stages={workflow.stages}
              currentStageIndex={workflow.currentStage}
              messages={normalizedMessages}
              createdAt={workflow.createdAt}
            />
          ) : null}
        </aside>

        <div className="space-y-4">
          {error ? (
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div className="space-y-1">
                  <CardTitle>Conversation unavailable</CardTitle>
                  <CardDescription>
                    We could not load this workflow. Retry to attempt again.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isRefetching}
                >
                  Retry
                </Button>
              </CardFooter>
            </Card>
          ) : null}

          <ConversationCard
            isLoading={isLoading}
            messages={normalizedMessages}
            workflowId={workflowId}
            status={workflow?.status}
            stageIndex={workflow?.currentStage}
            gateOptions={
              typeof workflow?.currentStage === "number"
                ? workflow?.stages?.[workflow.currentStage]?.gate?.options
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  );
}

function ConversationCard({
  isLoading,
  workflowId,
  status,
  messages,
  stageIndex,
  gateOptions,
}: {
  isLoading: boolean;
  workflowId: string;
  status?: string;
  messages?: WorkflowMessage[];
  stageIndex?: number;
  gateOptions?: StageGateOption[];
}) {
  return (
    <Card className="h-full">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Message list</CardTitle>
              <CardDescription>
                Live messages and system updates for workflow{" "}
                <span className="font-mono">{workflowId}</span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {status ?? "unknown"}
              </Badge>
              <WorkflowActions
                workflowId={workflowId}
                status={status}
                stageIndex={typeof stageIndex === "number" ? stageIndex : undefined}
                gateOptions={gateOptions}
              />
            </div>
          </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && !messages ? (
          <ConversationSkeleton />
        ) : (
          <ChatContainer
            workflowId={workflowId}
            initialMessages={messages}
            stageIndex={typeof stageIndex === "number" ? stageIndex : DEFAULT_STAGE_INDEX}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ConversationSkeleton() {
  const PLACEHOLDER_COUNT = 3;
  return (
    <div className="space-y-3">
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
        <div key={index} className="space-y-2 rounded-md border p-3">
          <Skeleton className="h-3 w-1/5" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}
