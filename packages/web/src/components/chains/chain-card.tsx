// ADR: ADR-011-web-api-architecture

import Link from "next/link";
import { FileText, ListTodo, MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { ChainProgress } from "./chain-progress";
import { ChainStatusBadge, type ChainStatus } from "./chain-status-badge";

/**
 * Chain type distinguishes design chains from implementation chains
 */
export type ChainType = "design" | "implementation";

interface ChainCardProps {
  /** Chain ID (e.g., "CHAIN-041-interactive-menu") */
  id: string;
  /** Chain title */
  title: string;
  /** Chain type */
  type?: ChainType;
  /** Associated request ID (e.g., "CR-20251208-001") */
  requestId: string;
  /** Total number of tasks */
  taskCount: number;
  /** Completion progress (0-100) */
  progress: number;
  /** Current chain status */
  status: ChainStatus;
  /** Associated workflow ID (optional) */
  workflowId?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Type badge styling configuration
 */
const typeConfig: Record<ChainType, { label: string; className: string }> = {
  design: {
    label: "design",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  },
  implementation: {
    label: "impl",
    className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  },
};

/**
 * ChainCard displays a summary of a chain in a card format.
 * Shows chain ID, title, type, request link, task count, progress, and status.
 */
export function ChainCard({
  id,
  title,
  type,
  requestId,
  taskCount,
  progress,
  status,
  workflowId,
  className,
}: ChainCardProps) {
  const typeStyle = type ? typeConfig[type] : null;

  return (
    <Link href={`/chains/${id}`} className="block">
      <Card
        className={cn(
          "transition-colors hover:bg-accent/50 cursor-pointer",
          className
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold truncate">
                {id}
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-1">
                {title}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {typeStyle && (
                <Badge
                  variant="outline"
                  className={cn("border-transparent text-xs", typeStyle.className)}
                >
                  {typeStyle.label}
                </Badge>
              )}
              <ChainStatusBadge status={status} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>{requestId}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ListTodo className="h-3.5 w-3.5" />
              <span>
                {taskCount} {taskCount === 1 ? "task" : "tasks"}
              </span>
            </div>
            {workflowId ? (
              <Link
                href={`/chat/${workflowId}`}
                className="inline-flex items-center gap-1.5 text-foreground underline-offset-4 hover:underline"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="font-medium">{workflowId}</span>
              </Link>
            ) : null}
          </div>
          <ChainProgress progress={progress} showLabel size="sm" />
        </CardContent>
      </Card>
    </Link>
  );
}
