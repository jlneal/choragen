// ADR: ADR-011-web-api-architecture

/**
 * RequestHeader - Displays request metadata in detail view
 *
 * Shows request ID, title, type badge, status badge,
 * domain, created date, owner, and back navigation.
 */

import Link from "next/link";
import { ArrowLeft, Calendar, Layers, User } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { RequestStatusBadge, type RequestStatus } from "./request-status-badge";
import { RequestTypeBadge, type RequestType } from "./request-type-badge";

interface RequestHeaderProps {
  /** Request ID (e.g., "CR-20251208-001") */
  id: string;
  /** Request title */
  title: string;
  /** Request type */
  type: RequestType;
  /** Current request status */
  status: RequestStatus;
  /** Domain (e.g., "core", "cli", "web") */
  domain: string;
  /** Created date (ISO string or formatted) */
  created: string;
  /** Owner (optional) */
  owner?: string;
  /** Optional actions slot (e.g., RequestActions dropdown) */
  actions?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * Format a date string for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    // Check if it's a valid date
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * RequestHeader displays the main metadata for a request in the detail view.
 */
export function RequestHeader({
  id,
  title,
  type,
  status,
  domain,
  created,
  owner,
  actions,
  className,
}: RequestHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Back navigation */}
      <Link
        href="/requests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Requests</span>
      </Link>

      {/* Title and badges row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{id}</h1>
          <p className="text-muted-foreground">{title}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <RequestTypeBadge type={type} />
          <RequestStatusBadge status={status} />
          {actions}
        </div>
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {/* Domain */}
        <div className="flex items-center gap-1.5">
          <Layers className="h-4 w-4" />
          <span>{domain}</span>
        </div>

        {/* Created date */}
        {created && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>Created {formatDate(created)}</span>
          </div>
        )}

        {/* Owner */}
        {owner && (
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>{owner}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for RequestHeader
 */
export function RequestHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Back navigation */}
      <Skeleton className="h-5 w-32" />

      {/* Title and badges row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
