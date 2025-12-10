// ADR: ADR-011-web-api-architecture

/**
 * AcceptanceCriteriaList - Displays acceptance criteria from request markdown
 *
 * Parses criteria from markdown content using checkbox pattern,
 * displays as read-only checklist with progress indicator.
 */

import { CheckCircle2, Circle } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AcceptanceCriterion {
  /** Whether the criterion is completed */
  completed: boolean;
  /** The criterion text */
  text: string;
}

interface AcceptanceCriteriaListProps {
  /** Raw markdown content to parse */
  content: string;
  /** Additional class names */
  className?: string;
}

/**
 * Parse acceptance criteria from markdown content
 * Matches patterns like: - [ ] Unchecked item or - [x] Checked item
 */
function parseAcceptanceCriteria(content: string): AcceptanceCriterion[] {
  const criteria: AcceptanceCriterion[] = [];
  const pattern = /^- \[([ xX])\] (.+)$/gm;

  let match;
  while ((match = pattern.exec(content)) !== null) {
    criteria.push({
      completed: match[1].toLowerCase() === "x",
      text: match[2].trim(),
    });
  }

  return criteria;
}

/**
 * AcceptanceCriteriaList parses and displays acceptance criteria from markdown.
 * Shows a progress indicator and read-only checkboxes.
 */
export function AcceptanceCriteriaList({
  content,
  className,
}: AcceptanceCriteriaListProps) {
  const criteria = parseAcceptanceCriteria(content);

  if (criteria.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No acceptance criteria found.
      </div>
    );
  }

  const completedCount = criteria.filter((c) => c.completed).length;
  const totalCount = criteria.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Acceptance Criteria</h3>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{totalCount} completed
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${progressPercent}% complete`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-in-out",
            completedCount === totalCount
              ? "bg-green-500 dark:bg-green-400"
              : "bg-blue-500 dark:bg-blue-400"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Criteria list */}
      <ul className="space-y-2">
        {criteria.map((criterion, index) => (
          <li
            key={index}
            className={cn(
              "flex items-start gap-2 text-sm",
              criterion.completed && "text-muted-foreground"
            )}
          >
            {criterion.completed ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 dark:text-green-400 flex-shrink-0" />
            ) : (
              <Circle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            )}
            <span className={cn(criterion.completed && "line-through")}>
              {criterion.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Loading skeleton for AcceptanceCriteriaList
 */
export function AcceptanceCriteriaListSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Progress bar */}
      <Skeleton className="h-2 w-full rounded-full" />

      {/* Criteria list */}
      <ul className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <li key={i} className="flex items-start gap-2">
            <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </li>
        ))}
      </ul>
    </div>
  );
}
