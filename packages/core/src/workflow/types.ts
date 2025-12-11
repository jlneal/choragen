/**
 * Workflow orchestration type definitions
 *
 * ADR: ADR-011-workflow-orchestration
 * Design: docs/design/core/features/workflow-orchestration.md
 */

/** Stage type determines available tools and behaviors */
export type StageType =
  | "request"
  | "design"
  | "review"
  | "implementation"
  | "verification";

/** All valid stage type values */
export const STAGE_TYPES: readonly StageType[] = [
  "request",
  "design",
  "review",
  "implementation",
  "verification",
] as const;

/** Overall workflow status */
export type WorkflowStatus =
  | "active"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

/** All valid workflow status values */
export const WORKFLOW_STATUSES: readonly WorkflowStatus[] = [
  "active",
  "paused",
  "completed",
  "failed",
  "cancelled",
] as const;

/** Current stage status */
export type StageStatus =
  | "pending"
  | "active"
  | "awaiting_gate"
  | "completed"
  | "skipped";

/** All valid stage status values */
export const STAGE_STATUSES: readonly StageStatus[] = [
  "pending",
  "active",
  "awaiting_gate",
  "completed",
  "skipped",
] as const;

/** Gate type determines what must happen to advance to the next stage */
export type GateType =
  | "auto"
  | "human_approval"
  | "chain_complete"
  | "verification_pass";

/** All valid gate type values */
export const GATE_TYPES: readonly GateType[] = [
  "auto",
  "human_approval",
  "chain_complete",
  "verification_pass",
] as const;

/** Message role identifies who sent the message */
export type MessageRole = "human" | "control" | "impl" | "system";

/** All valid message role values */
export const MESSAGE_ROLES: readonly MessageRole[] = [
  "human",
  "control",
  "impl",
  "system",
] as const;

/**
 * A gate defines what must happen to advance to the next stage.
 */
export interface StageGate {
  /** Gate type */
  type: GateType;

  /** For human_approval: prompt to show */
  prompt?: string;

  /** For chain_complete: which chain must complete */
  chainId?: string;

  /** For verification_pass: commands that must succeed */
  commands?: string[];

  /** Whether the gate has been satisfied */
  satisfied: boolean;

  /** Who/what satisfied the gate */
  satisfiedBy?: string;

  /** When the gate was satisfied */
  satisfiedAt?: Date;
}

/**
 * A stage represents a phase of work with defined entry/exit criteria.
 */
export interface WorkflowStage {
  /** Stage name */
  name: string;

  /** Stage type determines available tools and behaviors */
  type: StageType;

  /** Current stage status */
  status: StageStatus;

  /** Chain created for this stage (if applicable) */
  chainId?: string;

  /** Active session working on this stage */
  sessionId?: string;

  /** Gate configuration for advancing to next stage */
  gate: StageGate;

  /** When this stage started */
  startedAt?: Date;

  /** When this stage completed */
  completedAt?: Date;
}

/**
 * Messages form the conversation history and audit trail.
 */
export interface WorkflowMessage {
  /** Message ID */
  id: string;

  /** Who sent the message */
  role: MessageRole;

  /** Message content */
  content: string;

  /** Which stage this message belongs to */
  stageIndex: number;

  /** Timestamp */
  timestamp: Date;

  /** Optional metadata (tool calls, artifacts, streaming chunks, etc.) */
  metadata?: WorkflowMessageMetadata;
}

/**
 * Structured metadata for workflow messages.
 * Allows storing agent tool calls, streaming state, and session information.
 */
export type WorkflowMessageMetadata = {
  /** Tool calls executed for this message */
  toolCalls?: Array<{
    name: string;
    args: unknown;
    result?: unknown;
  }>;
  /** Whether message represents a streaming chunk */
  streaming?: boolean;
  /** Agent session identifier */
  sessionId?: string;
  /** Message classification (e.g., gate_prompt) */
  type?: string;
  /** Gate type for prompts */
  gateType?: GateType;
  /** Gate prompt text */
  prompt?: string;
} & Record<string, unknown>;

/**
 * A workflow represents the full lifecycle of a change request execution.
 */
export interface Workflow {
  /** Unique workflow identifier */
  id: string;

  /** The CR or FR this workflow is executing */
  requestId: string;

  /** Workflow template used (e.g., "standard", "hotfix") */
  template: string;

  /** Current stage index */
  currentStage: number;

  /** Overall workflow status */
  status: WorkflowStatus;

  /** Stage definitions and state */
  stages: WorkflowStage[];

  /** Conversation history for audit trail */
  messages: WorkflowMessage[];

  /** When the workflow was created */
  createdAt: Date;

  /** When the workflow was last updated */
  updatedAt: Date;
}
