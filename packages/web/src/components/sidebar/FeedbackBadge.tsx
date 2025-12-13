// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/agent-feedback.md
"use client";

// Inline types to avoid importing @choragen/core which has Node.js dependencies
type FeedbackPriority = "low" | "medium" | "high" | "critical";
const FEEDBACK_PRIORITIES: readonly FeedbackPriority[] = ["low", "medium", "high", "critical"] as const;

interface FeedbackItem {
  id: string;
  workflowId: string;
  stageIndex: number;
  type: string;
  createdByRole: string;
  content: string;
  status: string;
  priority: FeedbackPriority;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  context?: unknown;
  response?: {
    content: string;
    selectedOption?: string;
    respondedBy: string;
    respondedAt: Date;
  };
}
import { MessageSquare } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeedbackBadgeProps {
  workflowId: string;
  onClick?: () => void;
}

const priorityColor: Record<FeedbackPriority, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-muted text-muted-foreground border-muted",
};

export function FeedbackBadge({ workflowId, onClick }: FeedbackBadgeProps) {
  const feedbackQuery = trpc.feedback?.list?.useQuery;
  const { data } =
    feedbackQuery?.({ workflowId, status: "pending" }, { refetchInterval: 5000 }) ?? {
      data: [],
    };

  const normalized = ((data ?? []) as FeedbackLike[]).map(hydrateFeedbackItem);
  const count = normalized.length;
  if (count === 0) return null;

  const highestPriority = getHighestPriority(normalized);
  const className = highestPriority
    ? priorityColor[highestPriority]
    : "bg-muted text-muted-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2"
    >
      <Badge
        variant="outline"
        className={cn("flex items-center gap-1 border", className)}
        title="Pending feedback"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold">{count}</span>
      </Badge>
    </button>
  );
}

function getHighestPriority(items: FeedbackItem[]): FeedbackPriority | null {
  const rank: Record<FeedbackPriority, number> = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
  };

  return items
    .filter((item) => FEEDBACK_PRIORITIES.includes(item.priority))
    .sort((a, b) => rank[a.priority] - rank[b.priority])[0]?.priority ?? null;
}

type FeedbackLike = FeedbackItem & {
  createdAt: Date | string;
  updatedAt: Date | string;
  resolvedAt?: Date | string;
  response?: FeedbackItem["response"] & { respondedAt?: Date | string };
};

function hydrateFeedbackItem(item: FeedbackLike): FeedbackItem {
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
