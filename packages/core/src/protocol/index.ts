/**
 * Agent handoff protocol
 *
 * Structured message types for communication between
 * control agents and implementation agents.
 */

export interface TaskAssignment {
  type: "task-assignment";
  chainId: string;
  taskId: string;
  task: {
    title: string;
    description: string;
    expectedFiles: string[];
    acceptance: string[];
  };
  context: {
    /** Previous tasks in chain for context */
    previousTasks: string[];
    /** Relevant file paths to read */
    relevantFiles: string[];
    /** Any constraints or warnings */
    constraints: string[];
  };
}

export interface TaskCompletion {
  type: "task-completion";
  chainId: string;
  taskId: string;
  result: "success" | "blocked" | "failed";
  summary: string;
  /** Files that were actually modified */
  modifiedFiles: string[];
  /** Any issues encountered */
  issues?: string[];
  /** Suggested next steps if blocked/failed */
  suggestions?: string[];
}

export interface TaskReview {
  type: "task-review";
  chainId: string;
  taskId: string;
  decision: "approved" | "rework" | "blocked";
  feedback?: string;
  /** Specific items to address if rework */
  reworkItems?: string[];
}

export type ProtocolMessage = TaskAssignment | TaskCompletion | TaskReview;

// Placeholder exports - implementation in Phase 2
export const ProtocolFormatter = {
  // TODO: Implement in CR-20251205-005
};
