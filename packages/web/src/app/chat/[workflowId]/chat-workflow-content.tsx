// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, MessageSquare, Send } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { WorkflowSidebar } from "@/components/chat/workflow-sidebar";

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

function formatTimestamp(timestamp?: Date | string): string {
  if (!timestamp) {
    return "Just now";
  }

  const parsed =
    timestamp instanceof Date
      ? timestamp
      : timestamp
        ? new Date(timestamp)
        : null;

  if (!parsed || Number.isNaN(parsed.getTime())) {
    return "Just now";
  }

  return parsed.toLocaleString();
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
    () =>
      workflow?.messages.map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp as unknown as string),
      })),
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
            messages={workflow?.messages}
            workflowId={workflowId}
          />
          <InputAreaCard />
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
  messages,
  isLoading,
  workflowId,
}: {
  messages?: {
    id?: string;
    role: string;
    content: string;
    stageIndex?: number;
    timestamp?: Date | string;
  }[];
  isLoading: boolean;
  workflowId: string;
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
        <Badge variant="outline">Streaming soon</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <ConversationSkeleton />
        ) : messages && messages.length > 0 ? (
          messages.slice(-3).map((message) => (
            <MessageBubble
              key={message.id ?? message.content}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))
        ) : (
          <div className="rounded-md border border-dashed p-6 text-center">
            <p className="text-sm font-medium text-foreground">
              Conversation will appear here
            </p>
            <p className="text-sm text-muted-foreground">
              Messages from humans, control agents, and implementation agents will be
              streamed into this list.
            </p>
          </div>
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

function MessageBubble({
  role,
  content,
  timestamp,
}: {
  role: string;
  content: string;
  timestamp?: Date | string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2 font-medium capitalize">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          {role}
        </span>
        <span>{formatTimestamp(timestamp)}</span>
      </div>
      <p className="mt-2 text-sm text-foreground">{content}</p>
    </div>
  );
}

function InputAreaCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Input area</CardTitle>
        <CardDescription>
          Draft messages or gate responses to drive the workflow forward.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Message the workflow..."
          className="min-h-[120px]"
          disabled
        />
        <p className="text-xs text-muted-foreground">
          Real-time message sending will be connected to the workflow router.
        </p>
      </CardContent>
      <CardFooter className="justify-end">
        <Button size="sm" disabled>
          <Send className="mr-2 h-4 w-4" />
          Send message (coming soon)
        </Button>
      </CardFooter>
    </Card>
  );
}
