// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/agent-feedback.md
"use client";

import { useMemo, useState } from "react";

import type {
  FeedbackItem,
  FeedbackPriority,
  FeedbackStatus,
  FeedbackType,
} from "@choragen/core";
import { AlertCircle, RefreshCcw } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeedbackFilters, type FeedbackSortOption } from "./FeedbackFilters";
import { FeedbackList } from "./FeedbackList";

interface FeedbackPanelProps {
  workflowId: string;
}

export function FeedbackPanel({ workflowId }: FeedbackPanelProps) {
  const [status, setStatus] = useState<FeedbackStatus | undefined>(undefined);
  const [type, setType] = useState<FeedbackType | undefined>(undefined);
  const [priority, setPriority] = useState<FeedbackPriority | undefined>(undefined);
  const [sort, setSort] = useState<FeedbackSortOption>("date_desc");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch, error } = trpc.feedback.list.useQuery({
    workflowId,
    status,
    type,
    priority,
  });

  const normalized = useMemo(() => {
    const items = (data ?? []) as FeedbackLike[];
    return items.map(hydrateFeedbackItem);
  }, [data]);

  const feedback = useMemo(() => sortFeedbackItems(normalized, sort), [normalized, sort]);

  const handleReset = () => {
    setStatus(undefined);
    setType(undefined);
    setPriority(undefined);
    setSort("date_desc");
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading feedback...</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive/40">
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">Failed to load feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Feedback</p>
          <p className="text-xs text-muted-foreground">
            Review, respond, or dismiss feedback for this workflow.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      <FeedbackFilters
        status={status}
        type={type}
        priority={priority}
        sort={sort}
        onStatusChange={setStatus}
        onTypeChange={setType}
        onPriorityChange={setPriority}
        onSortChange={setSort}
        onReset={handleReset}
      />
      <FeedbackList
        feedback={feedback}
        expandedIds={expanded}
        onToggle={toggleExpanded}
        workflowId={workflowId}
      />
    </div>
  );
}

export function sortFeedbackItems(items: FeedbackItem[], sort: FeedbackSortOption): FeedbackItem[] {
  const priorityRank: Record<FeedbackItem["priority"], number> = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
  };

  const sorted = [...items];
  switch (sort) {
    case "priority":
      sorted.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
      break;
    case "type":
      sorted.sort((a, b) => a.type.localeCompare(b.type));
      break;
    case "date_desc":
    default:
      sorted.sort(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.updatedAt ?? a.createdAt).getTime()
      );
      break;
  }

  return sorted;
}

type FeedbackLike = FeedbackItem & {
  createdAt: Date | string;
  updatedAt: Date | string;
  resolvedAt?: Date | string;
  response?: FeedbackItem["response"] & { respondedAt?: Date | string };
};

export function hydrateFeedbackItem(item: FeedbackLike): FeedbackItem {
  return {
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
    resolvedAt: item.resolvedAt ? new Date(item.resolvedAt) : undefined,
    response: item.response
      ? {
          ...item.response,
          respondedAt: item.response.respondedAt
            ? new Date(item.response.respondedAt)
            : new Date(),
        }
      : undefined,
  };
}
