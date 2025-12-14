// ADR: ADR-011-workflow-orchestration
// Design doc: docs/design/core/features/agent-feedback.md

/**
 * Feedback domain types and constants
 *
 * Design doc: docs/design/core/features/agent-feedback.md
 */

export const FEEDBACK_TYPES = [
  "clarification",
  "question",
  "idea",
  "blocker",
  "review",
  "audit",
] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_STATUSES = [
  "pending",
  "acknowledged",
  "resolved",
  "dismissed",
] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;
export type FeedbackPriority = (typeof FEEDBACK_PRIORITIES)[number];

export interface FeedbackTypeBehavior {
  /** Default priority to assign when none is provided */
  defaultPriority: FeedbackPriority;
  /** Whether this feedback type should halt workflow progress until addressed */
  blocksWork: boolean;
  /** Description of what the feedback type represents */
  description: string;
}

export const FEEDBACK_TYPE_BEHAVIOR: Record<
  FeedbackType,
  FeedbackTypeBehavior
> = {
  clarification: {
    defaultPriority: "medium",
    blocksWork: true,
    description:
      "Requests missing information needed to continue the workflow.",
  },
  question: {
    defaultPriority: "low",
    blocksWork: false,
    description:
      "Asks about implementation or design choices; typically advisory.",
  },
  idea: {
    defaultPriority: "low",
    blocksWork: false,
    description:
      "Suggests improvements or alternatives; does not block progress.",
  },
  blocker: {
    defaultPriority: "critical",
    blocksWork: true,
    description:
      "Reports an issue preventing progress; requires resolution before continuing.",
  },
  review: {
    defaultPriority: "medium",
    blocksWork: false,
    description:
      "Requests human review of work; gating depends on process, not type.",
  },
  /**
   * System-generated, batched spot-check findings from commit audits.
   *
   * These are advisory, non-blocking findings that are not a comprehensive QA
   * pass. Audit feedback may spur follow-up requests but should not halt the
   * current workflow on its own.
   */
  audit: {
    defaultPriority: "low",
    blocksWork: false,
    description:
      "Batched, advisory spot-check findings produced by commit audits.",
  },
};

export interface FeedbackCodeSnippet {
  /** File path that contains the snippet */
  file: string;
  /** Starting line number (1-based) */
  startLine: number;
  /** Ending line number (inclusive, 1-based) */
  endLine: number;
  /** Snippet contents */
  content: string;
}

export interface FeedbackOption {
  /** Human-readable label for the option */
  label: string;
  /** Description of the option */
  description: string;
  /** Whether this option is recommended by the agent */
  recommended?: boolean;
}

export interface FeedbackContext {
  /** Related file paths */
  files?: string[];
  /** Code snippets for reference */
  codeSnippets?: FeedbackCodeSnippet[];
  /** Options the agent is considering */
  options?: FeedbackOption[];
  /** Additional structured metadata */
  metadata?: Record<string, unknown>;
}

export interface FeedbackResponse {
  /** The human's response content */
  content: string;
  /** If options were provided, which was selected */
  selectedOption?: string;
  /** Who responded */
  respondedBy: string;
  /** When responded */
  respondedAt: Date;
}

export interface FeedbackItem {
  /** Unique identifier */
  id: string;
  /** Workflow this feedback belongs to */
  workflowId: string;
  /** Stage index where feedback was created */
  stageIndex: number;
  /** Task ID if feedback is task-specific */
  taskId?: string;
  /** Chain ID if feedback is chain-specific */
  chainId?: string;
  /** Type of feedback */
  type: FeedbackType;
  /** Role of the agent that created this feedback */
  createdByRole: string;
  /** The feedback content/question */
  content: string;
  /** Additional context (code snippets, file refs, etc.) */
  context?: FeedbackContext;
  /** Current status */
  status: FeedbackStatus;
  /** Human response (when resolved) */
  response?: FeedbackResponse;
  /** Priority level */
  priority: FeedbackPriority;
  /** When created */
  createdAt: Date;
  /** When last updated */
  updatedAt: Date;
  /** When resolved */
  resolvedAt?: Date;
}
