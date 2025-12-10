// ADR: ADR-011-web-api-architecture

"use client";

/**
 * CommitHistory Component
 *
 * Displays recent git commits with:
 * - Abbreviated commit hash
 * - Commit message
 * - Author name
 * - Relative date
 * - Highlighted CR/FR references with links to request browser
 *
 * Supports configurable limit (default 10).
 */

import { useMemo } from "react";
import Link from "next/link";
import { GitCommit, User, Clock, ExternalLink, History } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Default number of commits to display */
const DEFAULT_LIMIT = 10;

/** Polling interval for commit history updates (ms) */
const POLL_INTERVAL_MS = 30000;

/** Regex pattern to match CR/FR references in commit messages */
const REQUEST_REFERENCE_PATTERN = /\[(CR-\d{8}-\d{3}|FR-\d{8}-\d{3})\]/g;

/**
 * Props for the CommitHistory component
 */
interface CommitHistoryProps {
  /** Number of commits to display (default: 10) */
  limit?: number;
  /** Additional class names */
  className?: string;
}

/**
 * Parsed request reference from a commit message
 */
interface RequestReference {
  /** Full match including brackets (e.g., "[CR-20251209-001]") */
  match: string;
  /** Request ID without brackets (e.g., "CR-20251209-001") */
  id: string;
  /** Request type: "CR" or "FR" */
  type: "CR" | "FR";
}

/**
 * Extract request references from a commit message
 */
export function extractRequestReferences(message: string): RequestReference[] {
  const matches = message.matchAll(REQUEST_REFERENCE_PATTERN);
  const references: RequestReference[] = [];

  for (const match of matches) {
    const id = match[1];
    const type = id.startsWith("CR") ? "CR" : "FR";
    references.push({
      match: match[0],
      id,
      type,
    });
  }

  return references;
}

/**
 * Abbreviate a git commit hash to 7 characters
 */
export function abbreviateHash(hash: string): string {
  const ABBREVIATED_LENGTH = 7;
  return hash.slice(0, ABBREVIATED_LENGTH);
}

/**
 * Format a date string as relative time (e.g., "2 hours ago")
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }
  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  // Fall back to formatted date for older commits
  return date.toLocaleDateString();
}

/**
 * CommitHistory displays recent git commits with CR/FR reference highlighting.
 */
export function CommitHistory({
  limit = DEFAULT_LIMIT,
  className,
}: CommitHistoryProps) {
  const { data, isLoading, isError } = trpc.git.log.useQuery(
    { limit },
    {
      refetchInterval: POLL_INTERVAL_MS,
      placeholderData: (prev) => prev,
    }
  );

  if (isLoading) {
    return <CommitHistorySkeleton className={className} limit={limit} />;
  }

  if (isError || !data) {
    return <CommitHistoryError className={className} />;
  }

  if (data.length === 0) {
    return <CommitHistoryEmpty className={className} />;
  }

  return (
    <Card className={className}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <History className="h-4 w-4" />
          <span>Recent Commits</span>
          <span className="text-muted-foreground">({data.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-3 pt-0">
        <div className="space-y-1">
          {data.map((commit) => (
            <CommitRow
              key={commit.hash}
              hash={commit.hash}
              message={commit.message}
              author={commit.author}
              date={commit.date}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Props for CommitRow component
 */
interface CommitRowProps {
  hash: string;
  message: string;
  author: string;
  date: string;
}

/**
 * CommitRow displays a single commit with highlighted references.
 */
function CommitRow({ hash, message, author, date }: CommitRowProps) {
  const abbreviatedHash = abbreviateHash(hash);
  const relativeDate = formatRelativeDate(date);
  const references = useMemo(() => extractRequestReferences(message), [message]);
  const hasReferences = references.length > 0;

  return (
    <div
      className={cn(
        "group rounded-md px-3 py-2 hover:bg-muted/50 transition-colors",
        hasReferences && "border-l-2 border-l-primary/50"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Commit hash */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                {abbreviatedHash}
              </code>
            </TooltipTrigger>
            <TooltipContent side="top">
              <span className="font-mono text-xs">{hash}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Message and metadata */}
        <div className="flex-1 min-w-0 space-y-1">
          <CommitMessage message={message} references={references} />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{relativeDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Props for CommitMessage component
 */
interface CommitMessageProps {
  message: string;
  references: RequestReference[];
}

/**
 * CommitMessage renders the commit message with highlighted CR/FR references.
 * References are rendered as links to the request browser.
 */
function CommitMessage({ message, references }: CommitMessageProps) {
  if (references.length === 0) {
    return (
      <p className="text-sm truncate" title={message}>
        {message}
      </p>
    );
  }

  // Split message by references and render with links
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Find all matches with their positions
  const matches: Array<{ match: string; id: string; type: "CR" | "FR"; index: number }> = [];
  let match;
  const regex = new RegExp(REQUEST_REFERENCE_PATTERN);
  while ((match = regex.exec(message)) !== null) {
    matches.push({
      match: match[0],
      id: match[1],
      type: match[1].startsWith("CR") ? "CR" : "FR",
      index: match.index,
    });
  }

  matches.forEach((m, i) => {
    // Add text before this match
    if (m.index > lastIndex) {
      parts.push(
        <span key={`text-${i}`}>{message.slice(lastIndex, m.index)}</span>
      );
    }

    // Add the reference link
    parts.push(
      <RequestReferenceLink key={`ref-${i}`} id={m.id} type={m.type} />
    );

    lastIndex = m.index + m.match.length;
  });

  // Add remaining text after last match
  if (lastIndex < message.length) {
    parts.push(<span key="text-end">{message.slice(lastIndex)}</span>);
  }

  return (
    <p className="text-sm truncate" title={message}>
      {parts}
    </p>
  );
}

/**
 * Props for RequestReferenceLink component
 */
interface RequestReferenceLinkProps {
  id: string;
  type: "CR" | "FR";
}

/**
 * RequestReferenceLink renders a highlighted link to a request.
 */
function RequestReferenceLink({ id, type }: RequestReferenceLinkProps) {
  const colorClass =
    type === "CR"
      ? "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
      : "text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300";

  return (
    <Link
      href={`/requests/${id}`}
      className={cn(
        "inline-flex items-center gap-0.5 font-medium",
        colorClass
      )}
      onClick={(e) => e.stopPropagation()}
    >
      [{id}]
      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

/**
 * CommitHistorySkeleton shows a loading placeholder.
 */
function CommitHistorySkeleton({
  className,
  limit = DEFAULT_LIMIT,
}: {
  className?: string;
  limit?: number;
}) {
  const SKELETON_COUNT = Math.min(limit, 5);
  return (
    <Card className={className}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-28 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-3 pt-0 space-y-2">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-3 py-2">
            <div className="h-5 w-14 bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * CommitHistoryError shows when commit history cannot be fetched.
 */
function CommitHistoryError({ className }: { className?: string }) {
  return (
    <Card className={cn("border-destructive/50", className)}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
          <History className="h-4 w-4" />
          Unable to fetch commit history
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

/**
 * CommitHistoryEmpty shows when there are no commits.
 */
function CommitHistoryEmpty({ className }: { className?: string }) {
  return (
    <Card className={cn("border-muted", className)}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <GitCommit className="h-4 w-4" />
          No commits yet
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
