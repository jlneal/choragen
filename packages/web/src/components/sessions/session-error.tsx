// ADR: ADR-011-web-api-architecture

import { AlertTriangle, Clock } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SessionErrorProps {
  /** When the session lock expired */
  expiresAt?: Date;
  /** Whether the session has expired */
  isExpired: boolean;
}

/**
 * Format a date for display
 */
function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * SessionError displays error details for failed or expired sessions.
 */
export function SessionError({ expiresAt, isExpired }: SessionErrorProps) {
  if (!isExpired) {
    return null;
  }

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Session Expired
        </CardTitle>
        <CardDescription>
          This session&apos;s lock has expired and is no longer active.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {expiresAt && (
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Expired at {formatDateTime(expiresAt)}
            </p>
          )}
          <p className="mt-2">
            The agent working on this session may have completed its work or the
            lock timed out. Check the chain for the latest status.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
