// ADR: ADR-001-task-file-format

/**
 * Menu utility functions.
 *
 * This module provides helper functions for the interactive menu,
 * including session counting and other dynamic data retrieval.
 */

import { Session } from "../runtime/index.js";

/**
 * Count paused sessions in the workspace.
 *
 * @param workspaceRoot - The workspace root directory
 * @returns Number of sessions with status 'paused'
 */
export async function countPausedSessions(
  workspaceRoot: string
): Promise<number> {
  try {
    const sessions = await Session.listAll(workspaceRoot);
    return sessions.filter((s) => s.status === "paused").length;
  } catch {
    // If sessions can't be listed, return 0
    return 0;
  }
}

/**
 * Get session counts by status.
 *
 * @param workspaceRoot - The workspace root directory
 * @returns Object with counts for each session status
 */
export async function getSessionCounts(
  workspaceRoot: string
): Promise<{
  running: number;
  paused: number;
  completed: number;
  failed: number;
  total: number;
}> {
  try {
    const sessions = await Session.listAll(workspaceRoot);
    const counts = {
      running: 0,
      paused: 0,
      completed: 0,
      failed: 0,
      total: sessions.length,
    };

    for (const session of sessions) {
      if (session.status in counts) {
        counts[session.status as keyof typeof counts]++;
      }
    }

    return counts;
  } catch {
    return { running: 0, paused: 0, completed: 0, failed: 0, total: 0 };
  }
}
