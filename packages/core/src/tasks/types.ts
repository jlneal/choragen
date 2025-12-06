/**
 * Task and Chain type definitions
 *
 * ADR: ADR-001-task-file-format
 */

/** Chain type distinguishes design chains from implementation chains */
export type ChainType = "design" | "implementation";

/** All valid chain type values */
export const CHAIN_TYPES: readonly ChainType[] = [
  "design",
  "implementation",
] as const;

/** Task status follows kanban-style directories */
export type TaskStatus =
  | "backlog"
  | "todo"
  | "in-progress"
  | "in-review"
  | "done"
  | "blocked";

/** All valid status values */
export const TASK_STATUSES: readonly TaskStatus[] = [
  "backlog",
  "todo",
  "in-progress",
  "in-review",
  "done",
  "blocked",
] as const;

/** Status transitions that are allowed */
export const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  backlog: ["todo", "blocked"],
  todo: ["in-progress", "blocked"],
  "in-progress": ["in-review", "blocked", "todo"],
  "in-review": ["done", "in-progress", "blocked"],
  done: [], // Terminal state
  blocked: ["todo", "backlog"],
};

export interface Task {
  /** Unique task identifier within chain (e.g., "001-setup-api") */
  id: string;
  /** Sequence number in chain (1, 2, 3...) */
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
  expectedFiles: string[];
  /** Acceptance criteria */
  acceptance: string[];
  /** Constraints or warnings */
  constraints: string[];
  /** Notes or additional context */
  notes: string;
  /** Created timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
}

export interface Chain {
  /** Unique chain identifier (e.g., "CHAIN-001-profile-backend") */
  id: string;
  /** Sequence number */
  sequence: number;
  /** Human-readable slug */
  slug: string;
  /** Associated CR/FR ID */
  requestId: string;
  /** Chain title */
  title: string;
  /** Chain description */
  description: string;
  /** Chain type - design or implementation (optional for backward compatibility) */
  type?: ChainType;
  /** Chain ID this chain depends on (e.g., impl chain depends on design chain) */
  dependsOn?: string;
  /** All tasks in this chain */
  tasks: Task[];
  /** Created timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
}

/** Options for creating a new chain */
export interface CreateChainOptions {
  requestId: string;
  slug: string;
  title: string;
  description?: string;
  /** Chain type - design or implementation */
  type?: ChainType;
  /** Chain ID this chain depends on */
  dependsOn?: string;
}

/** Options for creating a new task */
export interface CreateTaskOptions {
  chainId: string;
  slug: string;
  title: string;
  description: string;
  expectedFiles?: string[];
  acceptance?: string[];
  constraints?: string[];
  notes?: string;
}

/** Result of a task transition */
export interface TransitionResult {
  success: boolean;
  task: Task;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
  error?: string;
}

/** Configuration for the task system */
export interface TaskConfig {
  /** Base path for task files (default: "docs/tasks") */
  tasksPath: string;
  /** Date format for done archives (default: "YYYY-MM") */
  archiveDateFormat: string;
}

export const DEFAULT_TASK_CONFIG: TaskConfig = {
  tasksPath: "docs/tasks",
  archiveDateFormat: "YYYY-MM",
};
