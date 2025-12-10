// ADR: ADR-011-web-api-architecture

import Link from "next/link";
import { Calendar, User, AlertTriangle, Layers } from "lucide-react";

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
  className,
}: RequestCardProps) {
  const severityStyle = severity ? severityConfig[severity.toLowerCase()] : null;

  return (
    <Link href={`/requests/${id}`} className="block">
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
              <CardDescription className="mt-1 line-clamp-2">
                {title}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <RequestTypeBadge type={type} />
              <RequestStatusBadge status={status} />
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
        </CardContent>
      </Card>
    </Link>
  );
}
