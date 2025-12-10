// ADR: ADR-011-web-api-architecture

import Link from "next/link";
import { Clock, Files, User, Timer } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { SessionStatusBadge, type SessionStatus } from "./session-status-badge";

/**
 * Session data shape from the sessions router
 */
export interface Session {
  /** Chain ID this session is working on */
  chainId: string;
  /** Agent role (impl/control) */
  agent: string;
  /** When the session started */
  startedAt: Date;
  /** Files/patterns the session is working on */
  files: string[];
  /** When the session lock expires */
  expiresAt?: Date;
}

interface SessionCardProps {
  /** Session data */
  session: Session;
  /** Additional class names */
  className?: string;
}

/**
 * Derive session status from session data
 */
function deriveStatus(session: Session): SessionStatus {
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    return "failed";
  }
  return "running";
}

/**
 * Format a date for display
 */
function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format relative time (e.g., "5 min ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

/**
 * SessionCard displays a summary of an agent session in a card format.
 * Shows chain ID, agent role, files count, started time, and expiry.
 */
export function SessionCard({ session, className }: SessionCardProps) {
  const status = deriveStatus(session);
  const filesCount = session.files.length;

  return (
    <Link href={`/sessions/${session.chainId}`} className="block">
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
                {session.chainId}
              </CardTitle>
              <CardDescription className="mt-1">
                Agent session working on {filesCount} file{filesCount !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex-shrink-0">
              <SessionStatusBadge status={status} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span className="capitalize">{session.agent}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Files className="h-3.5 w-3.5" />
              <span>{filesCount} file{filesCount !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>Started {formatRelativeTime(session.startedAt)}</span>
            </div>
            {session.expiresAt && (
              <div className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5" />
                <span>Expires {formatTime(session.expiresAt)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
