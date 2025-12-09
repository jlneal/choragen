// ADR: ADR-010-agent-runtime-architecture

/**
 * Session list view for the interactive menu.
 *
 * This module provides formatting and display utilities for session lists,
 * including table formatting, status filtering, and pagination.
 */

import type { SessionSummary, SessionStatus } from "../runtime/index.js";

/**
 * Page size for session list pagination.
 */
export const SESSION_PAGE_SIZE = 20;

/**
 * Status filter options for session list.
 */
export type SessionStatusFilter = SessionStatus | "all" | "resumable";

/**
 * Session display info with formatted fields.
 */
export interface SessionDisplayInfo {
  /** Session ID */
  id: string;
  /** Short ID for display (last 6 chars) */
  shortId: string;
  /** Agent role */
  role: string;
  /** Session status */
  status: SessionStatus;
  /** Formatted start time */
  startedAt: string;
  /** Formatted token count */
  tokens: string;
  /** Context hint for paused/failed sessions */
  contextHint: string;
  /** Chain ID if present */
  chainId: string | null;
  /** Task ID if present */
  taskId: string | null;
}

/**
 * Paginated session list result.
 */
export interface PaginatedSessionList {
  /** Sessions on the current page */
  sessions: SessionDisplayInfo[];
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of sessions (after filtering) */
  totalSessions: number;
  /** Whether there's a next page */
  hasNextPage: boolean;
  /** Whether there's a previous page */
  hasPreviousPage: boolean;
}

/**
 * Format a session summary for display.
 *
 * @param summary - The session summary to format
 * @returns Formatted session display info
 */
export function formatSessionForDisplay(summary: SessionSummary): SessionDisplayInfo {
  const shortId = summary.id.slice(-6);
  const startedAt = formatTimestamp(summary.startTime);
  const tokens = formatTokenCount(summary.tokenUsage.total);
  const contextHint = getContextHint(summary);

  return {
    id: summary.id,
    shortId,
    role: summary.role,
    status: summary.status,
    startedAt,
    tokens,
    contextHint,
    chainId: summary.chainId,
    taskId: summary.taskId,
  };
}

/**
 * Format a timestamp for display.
 *
 * @param isoString - ISO timestamp string
 * @returns Formatted timestamp (e.g., "Dec 8, 14:30")
 */
export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${month} ${day}, ${hours}:${minutes}`;
}

/**
 * Format a token count for display.
 *
 * @param count - Token count
 * @returns Formatted token count (e.g., "12,345" or "1.2M")
 */
export function formatTokenCount(count: number): string {
  const ONE_MILLION = 1_000_000;
  if (count >= ONE_MILLION) {
    return `${(count / ONE_MILLION).toFixed(1)}M`;
  }
  return count.toLocaleString();
}

/**
 * Get a context hint for a session based on its status.
 *
 * @param summary - The session summary
 * @returns Context hint string
 */
export function getContextHint(summary: SessionSummary): string {
  switch (summary.status) {
    case "paused":
      return `Paused, ${formatTokenCount(summary.tokenUsage.total)} tokens used`;
    case "failed":
      return "Failed (check session for details)";
    case "running":
      return "Currently running";
    case "completed":
      return `Completed, ${formatTokenCount(summary.tokenUsage.total)} tokens used`;
    default:
      return "";
  }
}

/**
 * Filter sessions by status.
 *
 * @param sessions - Array of session summaries
 * @param filter - Status filter to apply
 * @returns Filtered sessions
 */
export function filterSessionsByStatus(
  sessions: SessionSummary[],
  filter: SessionStatusFilter
): SessionSummary[] {
  if (filter === "all") {
    return sessions;
  }

  if (filter === "resumable") {
    // Resumable sessions are paused or failed (with potentially recoverable errors)
    return sessions.filter(
      (s) => s.status === "paused" || s.status === "failed"
    );
  }

  return sessions.filter((s) => s.status === filter);
}

/**
 * Paginate a session list.
 *
 * @param sessions - Array of session summaries
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of sessions per page
 * @returns Paginated session list
 */
export function paginateSessions(
  sessions: SessionSummary[],
  page: number,
  pageSize: number = SESSION_PAGE_SIZE
): PaginatedSessionList {
  const totalSessions = sessions.length;
  const totalPages = Math.max(1, Math.ceil(totalSessions / pageSize));
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalSessions);
  const pageSessions = sessions.slice(startIndex, endIndex);

  return {
    sessions: pageSessions.map(formatSessionForDisplay),
    currentPage,
    totalPages,
    totalSessions,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

/**
 * Get status emoji for display.
 *
 * @param status - Session status
 * @returns Emoji representing the status
 */
export function getStatusEmoji(status: SessionStatus): string {
  switch (status) {
    case "running":
      return "🔄";
    case "paused":
      return "⏸️";
    case "completed":
      return "✅";
    case "failed":
      return "❌";
    default:
      return "❓";
  }
}

/**
 * Get status display label.
 *
 * @param status - Session status
 * @returns Human-readable status label
 */
export function getStatusLabel(status: SessionStatus): string {
  switch (status) {
    case "running":
      return "Running";
    case "paused":
      return "Paused";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return "Unknown";
  }
}

/**
 * Format a session row for table display.
 *
 * @param info - Session display info
 * @returns Formatted table row string
 */
export function formatSessionTableRow(info: SessionDisplayInfo): string {
  const status = getStatusEmoji(info.status);
  const role = info.role.padEnd(7);
  const tokens = info.tokens.padStart(8);
  return `${status} ${info.shortId}  ${role}  ${info.startedAt}  ${tokens}`;
}

/**
 * Build session list options for @clack/prompts select.
 *
 * @param sessions - Array of session display info
 * @returns Options array for select prompt
 */
export function buildSessionSelectOptions(
  sessions: SessionDisplayInfo[]
): Array<{ value: string; label: string; hint?: string }> {
  return sessions.map((session) => ({
    value: session.id,
    label: formatSessionTableRow(session),
    hint: session.contextHint,
  }));
}

/**
 * Check if a session can be resumed.
 *
 * @param status - Session status
 * @returns Whether the session can be resumed
 */
export function canResumeSession(status: SessionStatus): boolean {
  return status === "paused" || status === "failed";
}
