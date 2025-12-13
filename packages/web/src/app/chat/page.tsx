// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, MessageSquare } from "lucide-react";

import { ChatPageWrapper } from "@/components/chat/chat-page-wrapper";
import { NewWorkflowView } from "@/components/chat/new-workflow-view";

import { trpc } from "@/lib/trpc/client";
import { selectPrimaryWorkflow, formatUpdatedAt } from "@/lib/workflow-utils";
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

export default function ChatPage() {
  const {
    data: workflows,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = trpc.workflow.list.useQuery({ status: "active" });

  const activeWorkflows = workflows ?? [];
  const primaryWorkflow = useMemo(
    () => selectPrimaryWorkflow(activeWorkflows),
    [activeWorkflows]
  );
  const showEmptyState = !isLoading && activeWorkflows.length === 0;

  return (
    <ChatPageWrapper>
      <div className="space-y-6">
        <NewWorkflowView />

        {error ? (
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div className="space-y-1">
                <CardTitle>Unable to load workflows</CardTitle>
                <CardDescription>
                  There was a problem fetching active workflows. Retry to attempt again.
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Active conversations</h2>
            <p className="text-sm text-muted-foreground">
              Open chats for running workflows
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <ActiveWorkflowsSkeleton />
        ) : showEmptyState ? (
          <Card>
            <CardHeader>
              <CardTitle>No active workflows</CardTitle>
              <CardDescription>
                Use the form above to start a new workflow.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                isPrimary={workflow.id === primaryWorkflow?.id}
              />
            ))}
          </div>
        )}
      </div>

      </div>
    </ChatPageWrapper>
  );
}

function WorkflowCard({
  workflow,
  isPrimary,
}: {
  workflow: {
    id: string;
    status: string;
    requestId?: string;
    template?: string;
    updatedAt?: Date | string;
    currentStage?: number;
    stages?: unknown[];
  };
  isPrimary: boolean;
}) {
  const stageCount = workflow.stages ? workflow.stages.length : 0;
  const stageLabel =
    typeof workflow.currentStage === "number" && stageCount > 0
      ? `Stage ${workflow.currentStage + 1} of ${stageCount}`
      : "No stage data";

  return (
    <Card className={isPrimary ? "border-primary" : undefined}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span>{workflow.id}</span>
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Request
            </span>
            <span className="font-mono text-sm">{workflow.requestId ?? "Unlinked"}</span>
          </CardDescription>
        </div>
        <Badge variant="secondary" className="capitalize">
          {workflow.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Template</span>
          <span className="text-foreground font-medium">
            {workflow.template ?? "standard"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Stage</span>
          <span className="text-foreground font-medium">{stageLabel}</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {formatUpdatedAt(workflow.updatedAt)}
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href={`/chat/${workflow.id}`}>
            Open chat
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function ActiveWorkflowsSkeleton() {
  const PLACEHOLDER_COUNT = 2;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-24" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

