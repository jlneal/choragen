// ADR: ADR-011-web-api-architecture

import { FileText } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Session status types
 */
export type SessionStatus = "completed" | "in_progress" | "failed";

/**
 * Session data structure for the table
 */
export interface SessionData {
  /** Unique session identifier */
  id: string;
  /** Number of tokens used */
  tokens: number;
  /** Cost in USD */
  cost: number;
  /** Session status */
  status: SessionStatus;
  /** Session date */
  date: Date;
}

interface SessionsTableProps {
  /** Session data to display */
  sessions: SessionData[];
  /** Title for the table card */
  title?: string;
  /** Description for the table card */
  description?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Format a number with commas for thousands
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format cost as USD currency
 */
function formatCost(cost: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(cost);
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Get badge variant based on session status
 */
function getStatusBadgeVariant(
  status: SessionStatus
): "default" | "secondary" | "destructive" {
  switch (status) {
    case "completed":
      return "default";
    case "in_progress":
      return "secondary";
    case "failed":
      return "destructive";
  }
}

/**
 * Get display label for session status
 */
function getStatusLabel(status: SessionStatus): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In Progress";
    case "failed":
      return "Failed";
  }
}

/**
 * Truncate session ID for display
 */
function truncateId(id: string): string {
  const MAX_LENGTH = 12;
  if (id.length <= MAX_LENGTH) return id;
  return `${id.slice(0, MAX_LENGTH)}...`;
}

/**
 * SessionsTable displays a table of session data with status badges.
 *
 * Features:
 * - Sorted by date (most recent first)
 * - Status badges with color coding
 * - Empty state when no sessions
 * - Horizontal scroll on mobile
 *
 * @example
 * ```tsx
 * <SessionsTable
 *   sessions={sessions}
 *   title="Recent Sessions"
 *   description="Agent sessions from the past 30 days"
 * />
 * ```
 */
export function SessionsTable({
  sessions,
  title = "Sessions",
  description,
  className,
}: SessionsTableProps) {
  // Sort sessions by date (most recent first)
  const sortedSessions = [...sessions].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  const isEmpty = sortedSessions.length === 0;

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <SessionsEmptyState />
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono text-sm">
                      {truncateId(session.id)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(session.tokens)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCost(session.cost)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(session.status)}>
                        {getStatusLabel(session.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(session.date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Empty state displayed when no sessions exist
 */
function SessionsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <FileText className="h-12 w-12 mb-4 opacity-50" />
      <p className="text-sm">No sessions recorded yet</p>
    </div>
  );
}
