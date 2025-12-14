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
  | "verification"
  | "ideation";

/** All valid stage type values */
export const STAGE_TYPES: readonly StageType[] = [
  "request",
  "design",
  "review",
  "implementation",
  "verification",
  "ideation",
] as const;

/** Overall workflow status */
export type WorkflowStatus =
  | "active"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled"
  | "discarded";

/** All valid workflow status values */
export const WORKFLOW_STATUSES: readonly WorkflowStatus[] = [
  "active",
  "paused",
  "completed",
  "failed",
  "cancelled",
  "discarded",
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
  | "verification_pass"
  | "post_commit";

/** All valid gate type values */
export const GATE_TYPES: readonly GateType[] = [
  "auto",
  "human_approval",
  "chain_complete",
  "verification_pass",
  "post_commit",
] as const;

/**
 * An action executed during stage transitions
 */
export type TransitionAction =
  | CommandAction
  | TaskTransitionAction
  | FileMoveAction
  | CustomAction
  | SpawnAgentAction
  | PostMessageAction
  | EmitEventAction;

interface BaseTransitionAction {
  /** Whether failure blocks the transition (default: true) */
  blocking?: boolean;
}

/** Run a shell command */
export interface CommandAction extends BaseTransitionAction {
  /** Action type */
  type: "command";

  /** Shell command to run */
  command: string;
}

/** Transition a task to a new status */
export interface TaskTransitionAction extends BaseTransitionAction {
  /** Action type */
  type: "task_transition";

  /** The transition to apply */
  taskTransition: "start" | "complete" | "approve";
}

/** Move a file from one location to another */
export interface FileMoveAction extends BaseTransitionAction {
  /** Action type */
  type: "file_move";

  /** Source and destination patterns */
  fileMove: { from: string; to: string };
}

/** Invoke a registered custom handler */
export interface CustomAction extends BaseTransitionAction {
  /** Action type */
  type: "custom";

  /** Handler name registered in runtime */
  handler: string;
}

/** Spawn a new agent session with a specific role and context */
export interface SpawnAgentAction extends BaseTransitionAction {
  /** Action type */
  type: "spawn_agent";

  /** Role identifier for the new agent */
  role: string;

  /** Context injected into the agent session */
  context?: Record<string, unknown>;
}

/** Post a message into a target session */
export interface PostMessageAction extends BaseTransitionAction {
  /** Action type */
  type: "post_message";

  /** Target session ID or logical target (e.g., orchestrator) */
  target: string;

  /** Message content */
  content: string;

  /** Optional metadata payload */
  metadata?: Record<string, unknown>;
}

/** Emit a named event with an attached payload */
export interface EmitEventAction extends BaseTransitionAction {
  /** Action type */
  type: "emit_event";

  /** Event type identifier */
  eventType: string;

  /** Arbitrary event payload */
  payload?: Record<string, unknown>;
}

/**
 * Hooks executed when entering or exiting a stage
 */
export interface StageTransitionHooks {
  /** Actions to run when entering this stage */
  onEnter?: TransitionAction[];

  /** Actions to run when exiting this stage */
  onExit?: TransitionAction[];
}

export type TaskHookName = "onStart" | "onSubmit" | "onApprove" | "onReject";

export interface TaskHooks {
  onStart?: TransitionAction[];
  onSubmit?: TransitionAction[];
  onApprove?: TransitionAction[];
  onReject?: TransitionAction[];
}

export type ChainHookName = "onStart" | "onComplete" | "onApprove" | "onReject";

export interface ChainHooks {
  onStart?: TransitionAction[];
  onComplete?: TransitionAction[];
  onApprove?: TransitionAction[];
  onReject?: TransitionAction[];
}

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
export interface StageGateOption {
  /** Human-friendly label to show in approval UI */
  label: string;

  /** Action to take when selected (e.g., advance, discard) */
  action: string;
}

export interface StageGate {
  /** Gate type */
  type: GateType;

  /** Whether the gate prompt should only appear after an agent trigger */
  agentTriggered?: boolean;

  /** For human_approval: prompt to show */
  prompt?: string;

  /** Optional options for human_approval gates (e.g., continue vs discard) */
  options?: StageGateOption[];

  /** For chain_complete: which chain must complete */
  chainId?: string;

  /** For verification_pass: commands that must succeed */
  commands?: string[];

  /** For post_commit: commit metadata captured after git:commit */
  commit?: PostCommitMetadata;

  /** Whether audit creation should run for post_commit gates (defaults to true) */
  auditEnabled?: boolean;

  /** Whether the post_commit audit trigger has already been dispatched */
  auditTriggered?: boolean;

  /** Audit chain created from post_commit gate (if available) */
  auditChainId?: string;

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

  /** Prompt injected into agent context when stage activates */
  initPrompt?: string;

  /** Chain created for this stage (if applicable) */
  chainId?: string;

  /** Active session working on this stage */
  sessionId?: string;

  /** Gate configuration for advancing to next stage */
  gate: StageGate;

  /** Optional transition hooks */
  hooks?: StageTransitionHooks;

  /** When this stage started */
  startedAt?: Date;

  /** When this stage completed */
  completedAt?: Date;
}

/**
 * Commit metadata provided to the post_commit gate.
 */
export interface PostCommitMetadata {
  /** Commit SHA */
  sha: string;
  /** Commit message */
  message: string;
  /** Commit author */
  author: string;
  /** Files changed in the commit */
  filesChanged: string[];
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

  /** Feedback IDs that are currently blocking advancement */
  blockingFeedbackIds?: string[];
}
