// ADR: ADR-010-agent-runtime-architecture

/**
 * Agent session management CLI commands.
 * Provides resume, list-sessions, and cleanup commands.
 */

import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import {
  Session,
  type SessionSummary,
} from "../runtime/index.js";

/**
 * Sessions directory relative to workspace root.
 */
const SESSIONS_DIR = ".choragen/sessions";

/**
 * Options for the agent:resume command.
 */
export interface AgentResumeOptions {
  sessionId: string;
  json?: boolean;
}

/**
 * Options for the agent:list-sessions command.
 */
export interface AgentListSessionsOptions {
  json?: boolean;
  status?: string;
  limit?: number;
}

/**
 * Options for the agent:cleanup command.
 */
export interface AgentCleanupOptions {
  olderThanDays: number;
  json?: boolean;
  dryRun?: boolean;
}

/**
 * Parse agent:resume command arguments.
 */
export function parseAgentResumeArgs(
  args: string[]
): { success: true; options: AgentResumeOptions } | { success: false; error: string } {
  let sessionId: string | undefined;
  let json = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--json") {
      json = true;
    } else if (arg === "--help" || arg === "-h") {
      return { success: false, error: "SHOW_HELP" };
    } else if (arg.startsWith("-")) {
      return { success: false, error: `Unknown option: ${arg}` };
    } else if (!sessionId) {
      sessionId = arg;
    }
  }

  if (!sessionId) {
    return { success: false, error: "Missing required argument: <session-id>" };
  }

  return { success: true, options: { sessionId, json } };
}

/**
 * Parse agent:list-sessions command arguments.
 */
export function parseAgentListSessionsArgs(
  args: string[]
): { success: true; options: AgentListSessionsOptions } | { success: false; error: string } {
  let json = false;
  let status: string | undefined;
  let limit: number | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--json") {
      json = true;
    } else if (arg === "--status" && args[i + 1]) {
      status = args[++i];
      if (!["running", "paused", "completed", "failed"].includes(status)) {
        return { success: false, error: `Invalid status: ${status}. Must be 'running', 'paused', 'completed', or 'failed'.` };
      }
    } else if (arg.startsWith("--status=")) {
      status = arg.slice("--status=".length);
      if (!["running", "paused", "completed", "failed"].includes(status)) {
        return { success: false, error: `Invalid status: ${status}. Must be 'running', 'paused', 'completed', or 'failed'.` };
      }
    } else if (arg === "--limit" && args[i + 1]) {
      const value = parseInt(args[++i], 10);
      if (isNaN(value) || value < 1) {
        return { success: false, error: `Invalid limit: ${args[i]}. Must be a positive integer.` };
      }
      limit = value;
    } else if (arg.startsWith("--limit=")) {
      const value = parseInt(arg.slice("--limit=".length), 10);
      if (isNaN(value) || value < 1) {
        return { success: false, error: `Invalid limit: ${arg.slice("--limit=".length)}. Must be a positive integer.` };
      }
      limit = value;
    } else if (arg === "--help" || arg === "-h") {
      return { success: false, error: "SHOW_HELP" };
    } else if (arg.startsWith("-")) {
      return { success: false, error: `Unknown option: ${arg}` };
    }
  }

  return { success: true, options: { json, status, limit } };
}

/**
 * Parse agent:cleanup command arguments.
 */
export function parseAgentCleanupArgs(
  args: string[]
): { success: true; options: AgentCleanupOptions } | { success: false; error: string } {
  let olderThanDays = 30; // Default to 30 days
  let json = false;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--json") {
      json = true;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--older-than" && args[i + 1]) {
      const value = parseInt(args[++i], 10);
      if (isNaN(value) || value < 1) {
        return { success: false, error: `Invalid --older-than value: ${args[i]}. Must be a positive integer.` };
      }
      olderThanDays = value;
    } else if (arg.startsWith("--older-than=")) {
      const value = parseInt(arg.slice("--older-than=".length), 10);
      if (isNaN(value) || value < 1) {
        return { success: false, error: `Invalid --older-than value: ${arg.slice("--older-than=".length)}. Must be a positive integer.` };
      }
      olderThanDays = value;
    } else if (arg === "--help" || arg === "-h") {
      return { success: false, error: "SHOW_HELP" };
    } else if (arg.startsWith("-")) {
      return { success: false, error: `Unknown option: ${arg}` };
    }
  }

  return { success: true, options: { olderThanDays, json, dryRun } };
}

/**
 * Format a session summary for table display.
 */
function formatSessionRow(summary: SessionSummary): string {
  const id = summary.id;
  const role = summary.role.padEnd(8);
  const status = summary.status.padEnd(10);
  const started = summary.startTime.slice(0, 19).replace("T", " ");
  const tokens = summary.tokenUsage.total.toLocaleString().padStart(10);
  return `${id}  ${role}  ${status}  ${started}  ${tokens}`;
}

/**
 * Get help text for agent:resume command.
 */
export function getAgentResumeHelp(): string {
  return `
Usage: choragen agent:resume <session-id> [options]

Resume a paused or failed agent session.

Arguments:
  <session-id>    ID of the session to resume

Options:
  --json          Output result as JSON
  --help, -h      Show this help message

Notes:
  - Only sessions with status 'paused' or 'failed' (with recoverable error) can be resumed
  - The session will continue from its last completed turn
  - Messages and context are restored from the saved session state

Examples:
  # Resume a specific session
  choragen agent:resume session-20251208-143022-abc123

  # Resume with JSON output
  choragen agent:resume session-20251208-143022-abc123 --json
`.trim();
}

/**
 * Get help text for agent:list-sessions command.
 */
export function getAgentListSessionsHelp(): string {
  return `
Usage: choragen agent:list-sessions [options]

List all agent sessions with their status and token usage.

Options:
  --status=<status>   Filter by status: running, paused, completed, failed
  --limit=<n>         Limit number of results (default: all)
  --json              Output as JSON
  --help, -h          Show this help message

Output Columns:
  ID        Session identifier
  Role      Agent role (impl or control)
  Status    Session status (running, paused, completed, failed)
  Started   Session start time
  Tokens    Total tokens used

Examples:
  # List all sessions
  choragen agent:list-sessions

  # List only running sessions
  choragen agent:list-sessions --status=running

  # List last 10 sessions as JSON
  choragen agent:list-sessions --limit=10 --json
`.trim();
}

/**
 * Get help text for agent:cleanup command.
 */
export function getAgentCleanupHelp(): string {
  return `
Usage: choragen agent:cleanup [options]

Remove old session files to free disk space.

Options:
  --older-than=<days>   Delete sessions older than N days (default: 30)
  --dry-run             Show what would be deleted without deleting
  --json                Output result as JSON
  --help, -h            Show this help message

Notes:
  - Session age is determined by file modification time
  - This operation cannot be undone
  - Use --dry-run first to preview what will be deleted

Examples:
  # Delete sessions older than 30 days (default)
  choragen agent:cleanup

  # Delete sessions older than 7 days
  choragen agent:cleanup --older-than=7

  # Preview what would be deleted
  choragen agent:cleanup --older-than=7 --dry-run
`.trim();
}

/**
 * Run the agent:resume command.
 */
export async function runAgentResume(
  args: string[],
  workspaceRoot: string
): Promise<void> {
  const parseResult = parseAgentResumeArgs(args);

  if (!parseResult.success) {
    if (parseResult.error === "SHOW_HELP") {
      console.log(getAgentResumeHelp());
      return;
    }
    console.error(`Error: ${parseResult.error}`);
    console.error("Run 'choragen agent:resume --help' for usage information.");
    process.exit(1);
  }

  const { sessionId, json } = parseResult.options;

  // Load the session
  const session = await Session.load(sessionId, workspaceRoot);

  if (!session) {
    if (json) {
      console.log(JSON.stringify({ success: false, error: `Session not found: ${sessionId}` }));
    } else {
      console.error(`Error: Session not found: ${sessionId}`);
    }
    process.exit(1);
  }

  // Check if session can be resumed
  if (session.status === "completed") {
    if (json) {
      console.log(JSON.stringify({ success: false, error: "Session already completed" }));
    } else {
      console.error("Error: Session already completed");
    }
    process.exit(1);
  }

  if (session.status === "running") {
    if (json) {
      console.log(JSON.stringify({ success: false, error: "Session is currently running" }));
    } else {
      console.error("Error: Session is currently running");
    }
    process.exit(1);
  }

  if (session.status === "failed" && session.error && !session.error.recoverable) {
    if (json) {
      console.log(JSON.stringify({ 
        success: false, 
        error: "Session failed with non-recoverable error",
        details: session.error.message,
      }));
    } else {
      console.error(`Error: Session failed with non-recoverable error: ${session.error.message}`);
    }
    process.exit(1);
  }

  // Output session info for resume
  // Note: Actual resume loop execution would be handled by agent:start with --resume flag
  // For now, we output the session state that can be used for resume
  if (json) {
    console.log(JSON.stringify({
      success: true,
      session: {
        id: session.id,
        role: session.role,
        model: session.model,
        status: session.status,
        chainId: session.chainId,
        taskId: session.taskId,
        lastTurnIndex: session.lastTurnIndex,
        messageCount: session.messages.length,
        tokenUsage: session.tokenUsage,
      },
    }));
  } else {
    console.log(`Session: ${session.id}`);
    console.log(`Role: ${session.role} | Model: ${session.model}`);
    console.log(`Status: ${session.status}`);
    if (session.chainId) {
      console.log(`Chain: ${session.chainId}${session.taskId ? ` | Task: ${session.taskId}` : ""}`);
    }
    console.log(`Last Turn: ${session.lastTurnIndex} | Messages: ${session.messages.length}`);
    console.log(`Tokens: ${session.tokenUsage.input.toLocaleString()} in / ${session.tokenUsage.output.toLocaleString()} out`);
    console.log("");
    console.log("Session is ready to resume. Use agent:start with this session context.");
  }
}

/**
 * Run the agent:list-sessions command.
 */
export async function runAgentListSessions(
  args: string[],
  workspaceRoot: string
): Promise<void> {
  const parseResult = parseAgentListSessionsArgs(args);

  if (!parseResult.success) {
    if (parseResult.error === "SHOW_HELP") {
      console.log(getAgentListSessionsHelp());
      return;
    }
    console.error(`Error: ${parseResult.error}`);
    console.error("Run 'choragen agent:list-sessions --help' for usage information.");
    process.exit(1);
  }

  const { json, status, limit } = parseResult.options;

  // Get all sessions
  let sessions = await Session.listAll(workspaceRoot);

  // Filter by status if specified
  if (status) {
    sessions = sessions.filter((s) => s.status === status);
  }

  // Apply limit if specified
  if (limit && limit > 0) {
    sessions = sessions.slice(0, limit);
  }

  if (json) {
    console.log(JSON.stringify({ sessions }));
    return;
  }

  if (sessions.length === 0) {
    console.log("No sessions found.");
    return;
  }

  // Print table header
  const header = "ID                              Role      Status      Started              Tokens";
  const separator = "─".repeat(header.length);
  console.log(header);
  console.log(separator);

  // Print each session
  for (const session of sessions) {
    console.log(formatSessionRow(session));
  }

  console.log(separator);
  console.log(`Total: ${sessions.length} session(s)`);
}

/**
 * Run the agent:cleanup command.
 */
export async function runAgentCleanup(
  args: string[],
  workspaceRoot: string
): Promise<void> {
  const parseResult = parseAgentCleanupArgs(args);

  if (!parseResult.success) {
    if (parseResult.error === "SHOW_HELP") {
      console.log(getAgentCleanupHelp());
      return;
    }
    console.error(`Error: ${parseResult.error}`);
    console.error("Run 'choragen agent:cleanup --help' for usage information.");
    process.exit(1);
  }

  const { olderThanDays, json, dryRun } = parseResult.options;

  if (dryRun) {
    // For dry run, we need to count sessions that would be deleted
    // Use file modification time to match actual cleanup behavior
    const sessionsDir = join(workspaceRoot, SESSIONS_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffTime = cutoffDate.getTime();

    const oldSessions: { id: string; status: string }[] = [];
    try {
      const files = await readdir(sessionsDir);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));

      for (const file of jsonFiles) {
        try {
          const filePath = join(sessionsDir, file);
          const fileStat = await stat(filePath);
          if (fileStat.mtime.getTime() < cutoffTime) {
            // Load session to get status for display
            const sessionId = file.replace(".json", "");
            const session = await Session.load(sessionId, workspaceRoot);
            oldSessions.push({
              id: sessionId,
              status: session?.status ?? "unknown",
            });
          }
        } catch {
          // Skip files that can't be accessed
        }
      }
    } catch {
      // Sessions directory doesn't exist
    }

    if (json) {
      console.log(JSON.stringify({
        dryRun: true,
        wouldDelete: oldSessions.length,
        olderThanDays,
        sessions: oldSessions.map((s) => s.id),
      }));
    } else {
      if (oldSessions.length === 0) {
        console.log(`No sessions older than ${olderThanDays} days found.`);
      } else {
        console.log(`Would delete ${oldSessions.length} session(s) older than ${olderThanDays} days:`);
        for (const session of oldSessions) {
          console.log(`  - ${session.id} (${session.status})`);
        }
      }
    }
    return;
  }

  // Actually delete old sessions
  const deletedCount = await Session.cleanup(workspaceRoot, olderThanDays);

  if (json) {
    console.log(JSON.stringify({
      success: true,
      deleted: deletedCount,
      olderThanDays,
    }));
  } else {
    if (deletedCount === 0) {
      console.log(`No sessions older than ${olderThanDays} days found.`);
    } else {
      console.log(`Deleted ${deletedCount} session(s) older than ${olderThanDays} days.`);
    }
  }
}
