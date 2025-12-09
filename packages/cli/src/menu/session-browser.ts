// ADR: ADR-010-agent-runtime-architecture

/**
 * Session Browser for the interactive menu.
 *
 * This module provides an interactive browser for viewing, filtering,
 * and resuming agent sessions. It supports both "Resume Session" (resumable only)
 * and "List Sessions" (all sessions with filtering) modes.
 */

import * as p from "@clack/prompts";
import { Session, type SessionSummary, type SessionStatus } from "../runtime/index.js";
import type { MenuContext } from "./types.js";
import { wrapPromptResult } from "./prompts.js";
import {
  filterSessionsByStatus,
  paginateSessions,
  buildSessionSelectOptions,
  canResumeSession,
  getStatusLabel,
  formatTokenCount,
  formatTimestamp,
  SESSION_PAGE_SIZE,
  type SessionStatusFilter,
  type PaginatedSessionList,
} from "./session-list.js";

/**
 * Browser mode determines which sessions are shown and what actions are available.
 */
export type BrowserMode = "resume" | "list";

/**
 * Result from the session browser.
 */
export interface SessionBrowserResult {
  /** Whether the browser was cancelled */
  cancelled: boolean;
  /** Selected session ID (if any) */
  selectedSessionId?: string;
  /** Whether a session was resumed */
  resumed: boolean;
  /** Whether to return to main menu */
  returnToMenu: boolean;
}

/**
 * Session detail view data.
 */
export interface SessionDetailView {
  /** Session ID */
  id: string;
  /** Agent role */
  role: string;
  /** Model name */
  model: string;
  /** Session status */
  status: SessionStatus;
  /** Start time */
  startTime: string;
  /** End time (if completed) */
  endTime: string | null;
  /** Token usage */
  tokenUsage: { input: number; output: number; total: number };
  /** Chain ID */
  chainId: string | null;
  /** Task ID */
  taskId: string | null;
  /** Last turn index */
  lastTurnIndex: number;
  /** Message count */
  messageCount: number;
  /** Error details (if failed) */
  error?: { message: string; recoverable: boolean };
  /** Whether session can be resumed */
  canResume: boolean;
}

/**
 * Navigation action in the browser.
 */
type BrowserAction =
  | { type: "select"; sessionId: string }
  | { type: "filter"; status: SessionStatusFilter }
  | { type: "next-page" }
  | { type: "prev-page" }
  | { type: "back" }
  | { type: "cancel" };

/**
 * Detail view action.
 */
type DetailAction =
  | { type: "resume" }
  | { type: "back" }
  | { type: "cancel" };

/**
 * Run the session browser.
 *
 * @param context - Menu context with workspace info
 * @param mode - Browser mode (resume or list)
 * @returns Browser result
 */
export async function runSessionBrowser(
  context: MenuContext,
  mode: BrowserMode
): Promise<SessionBrowserResult> {
  const title = mode === "resume" ? "Resume Session" : "List Sessions";
  p.log.step(title);

  // Load all sessions
  const allSessions = await Session.listAll(context.workspaceRoot);

  // Initial filter based on mode
  let currentFilter: SessionStatusFilter = mode === "resume" ? "resumable" : "all";
  let currentPage = 1;

  // Main browser loop
  while (true) {
    // Apply filter
    const filteredSessions = filterSessionsByStatus(allSessions, currentFilter);

    // Handle empty list
    if (filteredSessions.length === 0) {
      const emptyResult = await handleEmptySessionList(mode, currentFilter);
      if (emptyResult.type === "filter") {
        currentFilter = emptyResult.status;
        currentPage = 1;
        continue;
      }
      return {
        cancelled: emptyResult.type === "cancel",
        resumed: false,
        returnToMenu: true,
      };
    }

    // Paginate
    const paginatedList = paginateSessions(filteredSessions, currentPage, SESSION_PAGE_SIZE);

    // Show session list and get action
    const action = await showSessionList(paginatedList, mode, currentFilter);

    switch (action.type) {
      case "select": {
        // Show session detail view
        const detailResult = await showSessionDetail(
          action.sessionId,
          context.workspaceRoot,
          mode
        );

        if (detailResult.type === "resume") {
          // Resume the session
          await resumeSession(action.sessionId, context.workspaceRoot);
          return {
            cancelled: false,
            selectedSessionId: action.sessionId,
            resumed: true,
            returnToMenu: false,
          };
        } else if (detailResult.type === "cancel") {
          return {
            cancelled: true,
            resumed: false,
            returnToMenu: true,
          };
        }
        // Back to list - continue loop
        break;
      }

      case "filter":
        currentFilter = action.status;
        currentPage = 1;
        break;

      case "next-page":
        if (paginatedList.hasNextPage) {
          currentPage++;
        }
        break;

      case "prev-page":
        if (paginatedList.hasPreviousPage) {
          currentPage--;
        }
        break;

      case "back":
        return {
          cancelled: false,
          resumed: false,
          returnToMenu: true,
        };

      case "cancel":
        return {
          cancelled: true,
          resumed: false,
          returnToMenu: true,
        };
    }
  }
}

/**
 * Handle empty session list with appropriate messaging.
 */
async function handleEmptySessionList(
  mode: BrowserMode,
  currentFilter: SessionStatusFilter
): Promise<{ type: "back" | "cancel" } | { type: "filter"; status: SessionStatusFilter }> {
  if (mode === "resume") {
    p.log.info("No resumable sessions found.");
    p.log.info("Sessions must be paused or failed to be resumed.");
  } else if (currentFilter !== "all") {
    p.log.info(`No sessions with status '${currentFilter}' found.`);

    // Offer to show all sessions
    const result = await p.confirm({
      message: "Show all sessions instead?",
      initialValue: true,
    });

    if (p.isCancel(result)) {
      return { type: "cancel" };
    }

    if (result) {
      return { type: "filter", status: "all" };
    }
  } else {
    p.log.info("No sessions found.");
    p.log.info("Start a new session from the main menu.");
  }

  return { type: "back" };
}

/**
 * Show the session list and get user action.
 */
async function showSessionList(
  paginatedList: PaginatedSessionList,
  mode: BrowserMode,
  currentFilter: SessionStatusFilter
): Promise<BrowserAction> {
  // Build options
  const sessionOptions = buildSessionSelectOptions(paginatedList.sessions);

  // Add navigation options
  const options: Array<{ value: string; label: string; hint?: string }> = [
    ...sessionOptions,
  ];

  // Add separator and navigation
  if (paginatedList.totalPages > 1) {
    options.push({ value: "---", label: "─".repeat(40) });

    if (paginatedList.hasPreviousPage) {
      options.push({
        value: "prev-page",
        label: "← Previous page",
        hint: `Page ${paginatedList.currentPage - 1}`,
      });
    }

    if (paginatedList.hasNextPage) {
      options.push({
        value: "next-page",
        label: "→ Next page",
        hint: `Page ${paginatedList.currentPage + 1}`,
      });
    }
  }

  // Add filter option for list mode
  if (mode === "list") {
    options.push({ value: "---filter", label: "─".repeat(40) });
    options.push({
      value: "filter",
      label: "🔍 Filter by status",
      hint: `Current: ${currentFilter}`,
    });
  }

  // Add back option
  options.push({ value: "---back", label: "─".repeat(40) });
  options.push({ value: "back", label: "← Back to main menu" });

  // Build message with pagination info
  const pageInfo = paginatedList.totalPages > 1
    ? ` (Page ${paginatedList.currentPage}/${paginatedList.totalPages})`
    : "";
  const filterInfo = currentFilter !== "all" ? ` [${currentFilter}]` : "";
  const message = `Select a session${filterInfo}${pageInfo}`;

  const result = await p.select({
    message,
    options: options.filter((o) => !o.value.startsWith("---")),
  });

  if (p.isCancel(result)) {
    return { type: "cancel" };
  }

  const value = result as string;

  if (value === "back") {
    return { type: "back" };
  }

  if (value === "prev-page") {
    return { type: "prev-page" };
  }

  if (value === "next-page") {
    return { type: "next-page" };
  }

  if (value === "filter") {
    const filterResult = await promptStatusFilter(currentFilter);
    if (filterResult.cancelled) {
      return { type: "cancel" };
    }
    return { type: "filter", status: filterResult.value! };
  }

  // Session selected
  return { type: "select", sessionId: value };
}

/**
 * Prompt for status filter selection.
 */
async function promptStatusFilter(
  currentFilter: SessionStatusFilter
): Promise<{ cancelled: boolean; value?: SessionStatusFilter }> {
  const options: Array<{ value: SessionStatusFilter; label: string; hint?: string }> = [
    { value: "all", label: "All sessions" },
    { value: "running", label: "Running", hint: "Currently active" },
    { value: "paused", label: "Paused", hint: "Can be resumed" },
    { value: "completed", label: "Completed", hint: "Finished successfully" },
    { value: "failed", label: "Failed", hint: "Ended with error" },
    { value: "resumable", label: "Resumable", hint: "Paused or failed" },
  ];

  // Mark current filter
  const optionsWithCurrent = options.map((o) => ({
    ...o,
    hint: o.value === currentFilter ? `${o.hint || ""} (current)`.trim() : o.hint,
  }));

  const result = await p.select({
    message: "Filter by status",
    options: optionsWithCurrent,
  });

  return wrapPromptResult(result as SessionStatusFilter);
}

/**
 * Show session detail view.
 */
async function showSessionDetail(
  sessionId: string,
  workspaceRoot: string,
  _mode: BrowserMode
): Promise<DetailAction> {
  const session = await Session.load(sessionId, workspaceRoot);

  if (!session) {
    p.log.error(`Session not found: ${sessionId}`);
    return { type: "back" };
  }

  // Build detail view
  const detail: SessionDetailView = {
    id: session.id,
    role: session.role,
    model: session.model,
    status: session.status,
    startTime: session.startTime,
    endTime: session.endTime,
    tokenUsage: session.tokenUsage,
    chainId: session.chainId,
    taskId: session.taskId,
    lastTurnIndex: session.lastTurnIndex,
    messageCount: session.messages.length,
    error: session.error,
    canResume: canResumeSession(session.status) &&
      (session.status !== "failed" || session.error?.recoverable !== false),
  };

  // Display session details
  displaySessionDetail(detail);

  // Build action options
  const options: Array<{ value: string; label: string; hint?: string }> = [];

  if (detail.canResume) {
    options.push({
      value: "resume",
      label: "▶️ Resume session",
      hint: `Continue from turn ${detail.lastTurnIndex}`,
    });
  }

  options.push({ value: "back", label: "← Back to list" });

  const result = await p.select({
    message: "What would you like to do?",
    options,
  });

  if (p.isCancel(result)) {
    return { type: "cancel" };
  }

  const value = result as string;

  if (value === "resume") {
    return { type: "resume" };
  }

  return { type: "back" };
}

/**
 * Display session detail information.
 */
function displaySessionDetail(detail: SessionDetailView): void {
  console.log("");
  console.log(`  Session: ${detail.id}`);
  console.log(`  Status:  ${getStatusLabel(detail.status)}`);
  console.log(`  Role:    ${detail.role}`);
  console.log(`  Model:   ${detail.model}`);
  console.log("");
  console.log(`  Started: ${formatTimestamp(detail.startTime)}`);
  if (detail.endTime) {
    console.log(`  Ended:   ${formatTimestamp(detail.endTime)}`);
  }
  console.log("");
  console.log(`  Tokens:  ${formatTokenCount(detail.tokenUsage.total)} total`);
  console.log(`           ${formatTokenCount(detail.tokenUsage.input)} input / ${formatTokenCount(detail.tokenUsage.output)} output`);
  console.log("");
  console.log(`  Turns:   ${detail.lastTurnIndex}`);
  console.log(`  Messages: ${detail.messageCount}`);

  if (detail.chainId) {
    console.log("");
    console.log(`  Chain:   ${detail.chainId}`);
    if (detail.taskId) {
      console.log(`  Task:    ${detail.taskId}`);
    }
  }

  if (detail.error) {
    console.log("");
    console.log(`  Error:   ${detail.error.message}`);
    console.log(`  Recoverable: ${detail.error.recoverable ? "Yes" : "No"}`);
  }

  console.log("");
}

/**
 * Resume a session.
 *
 * This function prepares the session for resume and outputs the necessary
 * information. The actual resume is handled by the agent runtime.
 */
async function resumeSession(
  sessionId: string,
  workspaceRoot: string
): Promise<void> {
  const session = await Session.load(sessionId, workspaceRoot);

  if (!session) {
    p.log.error(`Session not found: ${sessionId}`);
    return;
  }

  // Check if session can be resumed
  if (session.status === "completed") {
    p.log.error("Session already completed");
    return;
  }

  if (session.status === "running") {
    p.log.error("Session is currently running");
    return;
  }

  if (session.status === "failed" && session.error && !session.error.recoverable) {
    p.log.error(`Session failed with non-recoverable error: ${session.error.message}`);
    return;
  }

  // Output resume information
  p.log.success("Session ready to resume");
  console.log("");
  console.log(`  Session: ${session.id}`);
  console.log(`  Role: ${session.role} | Model: ${session.model}`);
  console.log(`  Last Turn: ${session.lastTurnIndex} | Messages: ${session.messages.length}`);
  console.log(`  Tokens: ${session.tokenUsage.input.toLocaleString()} in / ${session.tokenUsage.output.toLocaleString()} out`);
  console.log("");

  // Note: Full resume integration with agent:start would be implemented here
  // For now, we provide the session info for manual resume
  p.log.info("Use 'choragen agent:resume " + sessionId + "' to continue this session.");
}

/**
 * Get sessions filtered for resume mode (paused or failed with recoverable error).
 *
 * @param workspaceRoot - Workspace root directory
 * @returns Array of resumable session summaries
 */
export async function getResumableSessions(
  workspaceRoot: string
): Promise<SessionSummary[]> {
  const sessions = await Session.listAll(workspaceRoot);
  return filterSessionsByStatus(sessions, "resumable");
}

/**
 * Get all sessions with optional status filter.
 *
 * @param workspaceRoot - Workspace root directory
 * @param status - Optional status filter
 * @returns Array of session summaries
 */
export async function getFilteredSessions(
  workspaceRoot: string,
  status?: SessionStatusFilter
): Promise<SessionSummary[]> {
  const sessions = await Session.listAll(workspaceRoot);
  return filterSessionsByStatus(sessions, status ?? "all");
}
