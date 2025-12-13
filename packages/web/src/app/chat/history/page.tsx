// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock, History, ListFilter, RefreshCcw } from "lucide-react";

import { ChatPageWrapper } from "@/components/chat/chat-page-wrapper";
import { WorkflowCardSkeleton } from "@/components/chat/workflow-card-skeleton";
import { formatRelativeDate } from "@/components/git/commit-history";
import { trpc } from "@/lib/trpc/client";
import {
  formatStageProgress,
  groupWorkflowsByStatus,
  sortWorkflowsByActivity,
  STATUS_LABELS,
  type WorkflowGroup,
  type WorkflowSummary,
} from "@/lib/workflow-history-utils";
import { formatUpdatedAt } from "@/lib/workflow-utils";
import type { WorkflowStatus } from "@choragen/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type SortMode = "status" | "activity";

function normalizeDate(timestamp?: Date | string): Date | null {
  if (!timestamp) return null;
  const parsed = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatLastActivity(updatedAt?: Date | string): string {
  const parsed = normalizeDate(updatedAt);
  if (!parsed) return "Updated moments ago";
  return formatRelativeDate(parsed.toISOString());
}

export default function WorkflowHistoryPage() {
  const [sortMode, setSortMode] = useState<SortMode>("status");

  const {
    data: workflows,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = trpc.workflow.list.useQuery();

  const groupedWorkflows = useMemo(
    () => groupWorkflowsByStatus(workflows ?? []),
    [workflows]
  );
  const activityOrdered = useMemo(
    () => sortWorkflowsByActivity(workflows ?? []),
    [workflows]
  );

  const showEmptyState = !isLoading && (workflows?.length ?? 0) === 0;

  return (
    <ChatPageWrapper>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Workflow history
            </CardTitle>
            <CardDescription>
              Browse active, paused, completed, cancelled, or discarded workflows. Open
              any chat to continue the conversation.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={sortMode}
              onValueChange={(value) => setSortMode(value as SortMode)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Group by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Group by status</SelectItem>
                <SelectItem value="activity">Sort by last activity</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {error ? (
        <Card>
          <CardHeader className="flex flex-row items-start gap-3">
            <ListFilter className="h-5 w-5 text-destructive" />
            <div className="space-y-1">
              <CardTitle>Unable to load workflow history</CardTitle>
              <CardDescription>
                There was a problem fetching workflows. Retry to attempt again.
              </CardDescription>
            </div>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
              Retry
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {isLoading ? (
        <WorkflowCardSkeleton />
      ) : showEmptyState ? (
        <EmptyHistoryState />
      ) : sortMode === "status" ? (
        <div className="space-y-6">
          {groupedWorkflows.map((group) => (
            <StatusSection key={group.status} group={group} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Sorted by most recent activity
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {activityOrdered.map((workflow) => (
              <WorkflowHistoryCard key={workflow.id} workflow={workflow} />
            ))}
          </div>
        </div>
      )}
    </ChatPageWrapper>
  );
}

function StatusSection({ group }: { group: WorkflowGroup }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-2">
          <StatusBadge status={group.status} />
          <span className="text-sm text-muted-foreground">
            {group.workflows.length} {group.workflows.length === 1 ? "workflow" : "workflows"}
          </span>
        </div>
      </div>
      <Separator />
      <div className="grid gap-4 md:grid-cols-2">
        {group.workflows.map((workflow) => (
          <WorkflowHistoryCard key={workflow.id} workflow={workflow} />
        ))}
      </div>
    </div>
  );
}

function WorkflowHistoryCard({ workflow }: { workflow: WorkflowSummary }) {
  const stageLabel = formatStageProgress(workflow.currentStage, workflow.stages);
  const lastActivity = formatLastActivity(workflow.updatedAt);

  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-base">{workflow.requestId ?? "Unlinked request"}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Workflow
            </span>
            <span className="font-mono text-xs">{workflow.id}</span>
          </CardDescription>
        </div>
        <StatusBadge status={workflow.status} />
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Current stage</span>
          <span className="font-medium text-foreground">{stageLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last activity</span>
          </div>
          <span className="font-medium text-foreground">{lastActivity}</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>{formatUpdatedAt(workflow.updatedAt)}</span>
        <Button asChild size="sm" variant="outline">
          <Link href={`/chat/${workflow.id}`}>Open conversation</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function StatusBadge({ status }: { status: WorkflowStatus | "other" }) {
  const variant =
    status === "active"
      ? "default"
      : status === "paused"
        ? "secondary"
        : status === "failed"
          ? "destructive"
          : "outline";

  const label = STATUS_LABELS[status] ?? "Other";
  return (
    <Badge variant={variant} className="capitalize">
      {label}
    </Badge>
  );
}

function EmptyHistoryState() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle>No workflow activity yet</CardTitle>
        <CardDescription>
          When workflows start, pause, or complete, they will appear here. Create a chat
          to begin a new workflow.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild size="sm">
          <Link href="/chat">Go to chat</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
