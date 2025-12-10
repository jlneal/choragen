"use client";

// ADR: ADR-011-web-api-architecture

/**
 * SessionDetailContent - Client component for session detail page
 *
 * Handles data fetching and displays session information.
 */

import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

import {
  SessionHeader,
  SessionHeaderSkeleton,
} from "@/components/sessions/session-header";
import {
  SessionMetrics,
  SessionMetricsSkeleton,
} from "@/components/sessions/session-metrics";
import {
  SessionContext,
  SessionContextSkeleton,
} from "@/components/sessions/session-context";
import { SessionError } from "@/components/sessions/session-error";
import type { SessionStatus } from "@/components/sessions/session-status-badge";

interface SessionDetailContentProps {
  sessionId: string;
}

/**
 * Derive session status from session data
 */
function deriveStatus(expiresAt?: string): SessionStatus {
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return "failed";
  }
  return "running";
}

/**
 * Calculate session duration in minutes
 */
function calculateDuration(startedAt: string): number {
  const start = new Date(startedAt).getTime();
  const now = new Date().getTime();
  return Math.floor((now - start) / 60000);
}

export function SessionDetailContent({ sessionId }: SessionDetailContentProps) {
  // Fetch session data
  const {
    data: session,
    isLoading,
    error,
  } = trpc.sessions.get.useQuery(sessionId);

  // 404 handling
  if (error?.data?.code === "NOT_FOUND") {
    return (
      <div className="space-y-6">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sessions
        </Link>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-destructive/10 p-3 mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Session Not Found</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              No active session found for chain{" "}
              <code className="font-mono">{sessionId}</code>. The session may
              have ended or the lock expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Derive values from session data
  const status = session ? deriveStatus(session.expiresAt) : "running";
  const isExpired = status === "failed";
  const durationMinutes = session ? calculateDuration(session.startedAt) : 0;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link
        href="/sessions"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sessions
      </Link>

      {/* Session Header */}
      {isLoading ? (
        <SessionHeaderSkeleton />
      ) : session ? (
        <SessionHeader
          chainId={session.chainId}
          status={status}
          startedAt={new Date(session.startedAt)}
          expiresAt={session.expiresAt ? new Date(session.expiresAt) : undefined}
        />
      ) : null}

      {/* Error State (for expired sessions) */}
      {session && isExpired && (
        <SessionError
          expiresAt={session.expiresAt ? new Date(session.expiresAt) : undefined}
          isExpired={isExpired}
        />
      )}

      {/* Session Metrics */}
      {isLoading ? (
        <SessionMetricsSkeleton />
      ) : session ? (
        <SessionMetrics
          agent={session.agent}
          filesCount={session.files.length}
          durationMinutes={durationMinutes}
        />
      ) : null}

      {/* Session Context */}
      {isLoading ? (
        <SessionContextSkeleton />
      ) : session ? (
        <SessionContext chainId={session.chainId} files={session.files} />
      ) : null}
    </div>
  );
}
