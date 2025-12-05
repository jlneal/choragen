/**
 * Task and Chain lifecycle management
 *
 * Tasks are the atomic unit of work. Chains are sequences of tasks
 * managed by a control agent and executed by implementation agents.
 */

// Task status follows kanban-style directories
export type TaskStatus =
  | "backlog"
  | "todo"
  | "in-progress"
  | "in-review"
  | "done"
  | "blocked";

export interface Task {
  /** Unique task identifier within chain */
  id: string;
  /** Sequence number in chain (001, 002, etc.) */
  sequence: number;
  /** Human-readable slug */
  slug: string;
  /** Current status */
  status: TaskStatus;
  /** Parent chain ID */
  chainId: string;
  /** Task title */
  title: string;
  /** Full task description/instructions */
  description: string;
  /** Files this task is expected to touch */
  expectedFiles?: string[];
  /** Acceptance criteria */
  acceptance?: string[];
  /** Created timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
}

export interface Chain {
  /** Unique chain identifier (CHAIN-001-slug) */
  id: string;
  /** Sequence number */
  sequence: number;
  /** Human-readable slug */
  slug: string;
  /** Associated CR/FR ID */
  requestId: string;
  /** Current status (derived from task statuses) */
  status: TaskStatus;
  /** All tasks in this chain */
  tasks: Task[];
  /** Created timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
}

// Placeholder exports - implementation in Phase 2
export const TaskManager = {
  // TODO: Implement in CR-20251205-005
};

export const ChainManager = {
  // TODO: Implement in CR-20251205-005
};
