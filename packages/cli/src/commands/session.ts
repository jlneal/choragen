// ADR: ADR-001-task-file-format

/**
 * Session management commands
 *
 * Sessions track the current agent role and optionally the task being worked on.
 * Session state is stored in .choragen/session.json (JSON for simplicity, no external deps).
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

/**
 * Valid session roles
 */
export type SessionRole = "impl" | "control";

/**
 * Session data stored in .choragen/session.json
 */
export interface SessionData {
  role: SessionRole;
  task?: string;
  started: string;
}

/**
 * Result from session operations
 */
export interface SessionResult {
  success: boolean;
  error?: string;
  session?: SessionData;
}

/**
 * Get the session file path
 */
function getSessionFilePath(projectRoot: string): string {
  return join(projectRoot, ".choragen", "session.json");
}

/**
 * Read the current session if it exists
 */
export function readSession(projectRoot: string): SessionData | null {
  const sessionPath = getSessionFilePath(projectRoot);

  if (!existsSync(sessionPath)) {
    return null;
  }

  try {
    const content = readFileSync(sessionPath, "utf-8");
    return JSON.parse(content) as SessionData;
  } catch {
    return null;
  }
}

/**
 * Start a new session
 */
export function startSession(
  projectRoot: string,
  role: SessionRole,
  task?: string
): SessionResult {
  // Validate role
  if (role !== "impl" && role !== "control") {
    return {
      success: false,
      error: `Invalid role: ${role}. Must be 'impl' or 'control'.`,
    };
  }

  const sessionPath = getSessionFilePath(projectRoot);
  const sessionDir = dirname(sessionPath);

  // Ensure .choragen directory exists
  if (!existsSync(sessionDir)) {
    mkdirSync(sessionDir, { recursive: true });
  }

  const session: SessionData = {
    role,
    started: new Date().toISOString(),
  };

  if (task) {
    session.task = task;
  }

  try {
    writeFileSync(sessionPath, JSON.stringify(session, null, 2), "utf-8");
    return { success: true, session };
  } catch (err) {
    return {
      success: false,
      error: `Failed to write session file: ${(err as Error).message}`,
    };
  }
}

/**
 * Get current session status
 */
export function getSessionStatus(projectRoot: string): SessionResult {
  const session = readSession(projectRoot);

  if (!session) {
    return {
      success: true,
      session: undefined,
    };
  }

  return {
    success: true,
    session,
  };
}

/**
 * End the current session
 */
export function endSession(projectRoot: string): SessionResult {
  const sessionPath = getSessionFilePath(projectRoot);

  if (!existsSync(sessionPath)) {
    return {
      success: true,
      // No session to end, but that's okay
    };
  }

  try {
    unlinkSync(sessionPath);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: `Failed to remove session file: ${(err as Error).message}`,
    };
  }
}

/**
 * Format session status for display
 */
export function formatSessionStatus(session: SessionData | undefined): string {
  if (!session) {
    return "No active session";
  }

  const lines: string[] = [];
  lines.push(`Role: ${session.role}`);

  if (session.task) {
    lines.push(`Task: ${session.task}`);
  }

  lines.push(`Started: ${session.started}`);

  return lines.join("\n");
}
