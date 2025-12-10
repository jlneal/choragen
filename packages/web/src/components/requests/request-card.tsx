// ADR: ADR-011-web-api-architecture

"use client";

import Link from "next/link";
import { Calendar, User, AlertTriangle, Layers, ArrowUp, ArrowDown } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { RequestStatusBadge, type RequestStatus } from "./request-status-badge";
import { RequestTypeBadge, type RequestType } from "./request-type-badge";
import { TagList } from "@/components/tags";

interface RequestCardProps {
  /** Request ID (e.g., "CR-20251208-001") */
  id: string;
  /** Request title */
  title: string;
  /** Request type (change-request or fix-request) */
  type: RequestType;
  /** Domain (e.g., "core", "cli", "web") */
  domain: string;
  /** Current request status */
  status: RequestStatus;
  /** Creation date (ISO string) */
  created: string;
  /** Owner (optional) */
  owner?: string;
  /** Severity (optional, only for fix requests) */
  severity?: string;
  /** Tags (optional) */
  tags?: string[];
  /** Callback when a tag is clicked */
  onTagClick?: (tag: string) => void;
  /** Callback to promote a backlog request to todo */
  onPromote?: (id: string) => void;
  /** Callback to demote a todo request to backlog */
  onDemote?: (id: string) => void;
  /** Whether an action is currently in progress */
  isActionPending?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Severity badge styling configuration
 */
const severityConfig: Record<string, string> = {
  critical: "text-red-600 dark:text-red-400",
  high: "text-orange-600 dark:text-orange-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  low: "text-slate-600 dark:text-slate-400",
};

/**
 * RequestCard displays a summary of a request in a card format.
 * Shows request ID, title, type, domain, status, and metadata.
 */
export function RequestCard({
  id,
  title,
  type,
  domain,
  status,
  created,
  owner,
  severity,
  tags,
  onTagClick,
  onPromote,
  onDemote,
  isActionPending = false,
  className,
}: RequestCardProps) {
  const severityStyle = severity ? severityConfig[severity.toLowerCase()] : null;
  const showPromote = status === "backlog" && onPromote;
  const showDemote = status === "todo" && onDemote;
  const hasActions = showPromote || showDemote;

  const cardContent = (
    <Card
      className={cn(
        "transition-colors hover:bg-accent/50",
        !hasActions && "cursor-pointer",
        isActionPending && "opacity-50",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/requests/${id}`} className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate hover:underline">
              {id}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {title}
            </CardDescription>
          </Link>
          <div className="flex items-center gap-2 flex-shrink-0">
            <RequestTypeBadge type={type} />
            <RequestStatusBadge status={status} />
            {showPromote && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPromote(id);
                }}
                disabled={isActionPending}
                className="gap-1"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                Promote
              </Button>
            )}
            {showDemote && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDemote(id);
                }}
                disabled={isActionPending}
                className="gap-1"
              >
                <ArrowDown className="h-3.5 w-3.5" />
                Demote
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            <span>{domain}</span>
          </div>
          {created && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{created}</span>
            </div>
          )}
          {owner && (
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>{owner}</span>
            </div>
          )}
          {severity && (
            <div className={cn("flex items-center gap-1.5", severityStyle)}>
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="capitalize">{severity}</span>
            </div>
          )}
        </div>
        {tags && tags.length > 0 && (
          <TagList
            tags={tags}
            clickable={!!onTagClick}
            onTagClick={onTagClick}
            maxVisible={3}
            className="mt-2"
          />
        )}
      </CardContent>
    </Card>
  );

  // If there are no actions, wrap the entire card in a link
  if (!hasActions) {
    return (
      <Link href={`/requests/${id}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
