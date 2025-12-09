"use client";

// ADR: ADR-011-web-api-architecture

/**
 * ChainDetailContent - Client component for chain detail page
 *
 * Handles data fetching, task selection, and detail panel state.
 */

import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChainHeader,
  ChainHeaderSkeleton,
  type ChainStatus,
  type ChainType,
} from "@/components/chains";
import {
  TaskList,
  TaskListSkeleton,
  TaskDetailPanel,
  type TaskRowData,
} from "@/components/tasks";
import { useTaskDetail } from "@/hooks";
import { trpc } from "@/lib/trpc/client";

interface ChainDetailContentProps {
  chainId: string;
}

/**
 * Map chain status from API to component status type
 */
function mapChainStatus(status: string): ChainStatus {
  const validStatuses: ChainStatus[] = [
    "backlog",
    "todo",
    "in-progress",
    "in-review",
    "done",
    "blocked",
  ];
  return validStatuses.includes(status as ChainStatus)
    ? (status as ChainStatus)
    : "todo";
}

/**
 * Map chain type from API to component type
 */
function mapChainType(type?: string): ChainType | undefined {
  if (type === "design" || type === "implementation") {
    return type;
  }
  return undefined;
}

export function ChainDetailContent({ chainId }: ChainDetailContentProps) {
  // Fetch chain data
  const {
    data: chain,
    isLoading: isChainLoading,
    error: chainError,
  } = trpc.chains.get.useQuery(chainId);

  // Fetch chain summary for progress
  const { data: summary, isLoading: isSummaryLoading } =
    trpc.chains.getSummary.useQuery(chainId, {
      enabled: !!chain,
    });

  // Fetch tasks for the chain
  const { data: tasks, isLoading: isTasksLoading } =
    trpc.tasks.listForChain.useQuery(chainId, {
      enabled: !!chain,
    });

  // Task detail panel state
  const { chainId: selectedChainId, taskId, isOpen, openTask, setIsOpen } =
    useTaskDetail();

  // Handle task click
  const handleTaskClick = (task: TaskRowData) => {
    openTask(chainId, task.id);
  };

  // Transform tasks to TaskRowData format
  const taskRows: TaskRowData[] = (tasks ?? []).map((task, index) => ({
    id: task.id,
    sequence: index + 1,
    slug: task.slug,
    title: task.title,
    status: task.status,
  }));

  // 404 handling
  if (chainError?.data?.code === "NOT_FOUND") {
    return (
      <div className="space-y-6">
        <Link
          href="/chains"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Chains
        </Link>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-destructive/10 p-3 mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Chain Not Found</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              The chain <code className="font-mono">{chainId}</code> does not
              exist or has been deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate progress
  const progress = summary?.progress ?? 0;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link
        href="/chains"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Chains
      </Link>

      {/* Chain Header */}
      {isChainLoading || isSummaryLoading ? (
        <ChainHeaderSkeleton />
      ) : chain ? (
        <ChainHeader
          id={chain.id}
          title={chain.title}
          type={mapChainType(chain.type)}
          requestId={chain.requestId}
          status={mapChainStatus(summary?.status ?? "todo")}
          progress={progress}
          createdAt={chain.createdAt}
        />
      ) : null}

      {/* Tasks Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>
            All tasks in this chain and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isTasksLoading ? (
            <TaskListSkeleton count={3} />
          ) : (
            <TaskList
              tasks={taskRows}
              selectedTaskId={taskId ?? undefined}
              onTaskClick={handleTaskClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Task Detail Panel */}
      <TaskDetailPanel
        chainId={selectedChainId}
        taskId={taskId}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </div>
  );
}
