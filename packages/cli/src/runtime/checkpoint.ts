// ADR: ADR-010-agent-runtime-architecture

/**
 * Human-in-the-loop checkpoint system for sensitive actions.
 * Provides approval prompts for actions that require human oversight.
 */

import { createInterface, Interface } from "node:readline";

/**
 * Default approval timeout in milliseconds (5 minutes).
 */
const DEFAULT_APPROVAL_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Actions that require human approval when checkpoints are enabled.
 */
export const SENSITIVE_ACTIONS = new Set([
  "write_file", // When deleting (empty content)
  "task_complete", // Completing work
  "chain_close", // Closing a chain
  "spawn_session", // Starting nested session
]);

/**
 * Result of an approval request.
 */
export type ApprovalResult =
  | { approved: true }
  | { approved: false; reason: "rejected" | "timeout" };

/**
 * Configuration for the checkpoint handler.
 */
export interface CheckpointConfig {
  /** Whether approval is required for sensitive actions */
  requireApproval: boolean;
  /** Whether to auto-approve all actions (for CI/CD) */
  autoApprove: boolean;
  /** Approval timeout in milliseconds */
  approvalTimeoutMs: number;
  /** Session ID for display */
  sessionId?: string;
}

/**
 * Context for an approval request.
 */
export interface ApprovalContext {
  /** Tool/action name */
  action: string;
  /** Tool parameters */
  params: Record<string, unknown>;
  /** Session ID */
  sessionId?: string;
}

/**
 * Callback for when an action is rejected or times out.
 */
export type ApprovalCallback = (
  context: ApprovalContext,
  result: ApprovalResult
) => void;

/**
 * Handler for human-in-the-loop checkpoints.
 */
export class CheckpointHandler {
  private readonly config: CheckpointConfig;
  private readonly onRejection?: ApprovalCallback;
  private isPaused = false;

  constructor(config: Partial<CheckpointConfig> = {}, onRejection?: ApprovalCallback) {
    this.config = {
      requireApproval: config.requireApproval ?? false,
      autoApprove: config.autoApprove ?? false,
      approvalTimeoutMs: config.approvalTimeoutMs ?? DEFAULT_APPROVAL_TIMEOUT_MS,
      sessionId: config.sessionId,
    };
    this.onRejection = onRejection;
  }

  /**
   * Check if an action requires approval.
   * @param action - The action/tool name
   * @param params - The action parameters
   * @returns true if approval is required
   */
  requiresApproval(action: string, params: unknown): boolean {
    // If approval is not required or auto-approve is enabled, skip
    if (!this.config.requireApproval || this.config.autoApprove) {
      return false;
    }

    // Check if this is a sensitive action
    if (!SENSITIVE_ACTIONS.has(action)) {
      return false;
    }

    // Special case: write_file only requires approval for deletes (empty content)
    if (action === "write_file") {
      const writeParams = params as { content?: string } | undefined;
      // Only require approval for delete operations (empty or no content)
      return !writeParams?.content || writeParams.content.trim() === "";
    }

    return true;
  }

  /**
   * Request approval for an action.
   * @param action - The action/tool name
   * @param params - The action parameters
   * @returns Approval result
   */
  async requestApproval(
    action: string,
    params: unknown
  ): Promise<ApprovalResult> {
    const context: ApprovalContext = {
      action,
      params: params as Record<string, unknown>,
      sessionId: this.config.sessionId,
    };

    // Auto-approve if configured
    if (this.config.autoApprove) {
      return { approved: true };
    }

    // Display approval prompt
    this.displayApprovalPrompt(context);

    // Wait for user input with timeout
    const result = await this.waitForApproval();

    // Handle rejection or timeout
    if (!result.approved) {
      if (result.reason === "timeout") {
        this.isPaused = true;
        console.log("\n⏸️  Session paused due to approval timeout.");
      } else {
        console.log("\n❌ Action rejected. Informing agent...");
      }
      this.onRejection?.(context, result);
    } else {
      console.log("\n✅ Action approved.");
    }

    return result;
  }

  /**
   * Check if the session is paused due to timeout.
   */
  get paused(): boolean {
    return this.isPaused;
  }

  /**
   * Resume a paused session.
   */
  resume(): void {
    this.isPaused = false;
  }

  /**
   * Display the approval prompt box.
   */
  private displayApprovalPrompt(context: ApprovalContext): void {
    const timeoutMinutes = Math.floor(this.config.approvalTimeoutMs / 60000);
    const timeoutDisplay = timeoutMinutes >= 1 ? `${timeoutMinutes}m` : `${Math.floor(this.config.approvalTimeoutMs / 1000)}s`;

    const lines: string[] = [];
    lines.push("");
    lines.push("┌─────────────────────────────────────────────────────────────┐");
    lines.push("│  ⚠️  APPROVAL REQUIRED                                      │");
    lines.push("│                                                             │");

    // Format action display
    const actionDisplay = this.formatActionDisplay(context);
    lines.push(`│  Action: ${actionDisplay.padEnd(50)}│`);

    // Format path if present
    if (context.params.path || context.params.filePath) {
      const path = (context.params.path ?? context.params.filePath) as string;
      const truncatedPath = path.length > 48 ? "..." + path.slice(-45) : path;
      lines.push(`│  Path: ${truncatedPath.padEnd(52)}│`);
    }

    // Format chain/task if present
    if (context.params.chainId) {
      lines.push(`│  Chain: ${String(context.params.chainId).padEnd(51)}│`);
    }
    if (context.params.taskId) {
      lines.push(`│  Task: ${String(context.params.taskId).padEnd(52)}│`);
    }

    // Session ID
    if (context.sessionId) {
      const truncatedSession = context.sessionId.length > 48 ? context.sessionId.slice(0, 45) + "..." : context.sessionId;
      lines.push(`│  Session: ${truncatedSession.padEnd(49)}│`);
    }

    lines.push("│                                                             │");
    lines.push(`│  Approve? [y/N] (timeout: ${timeoutDisplay})`.padEnd(62) + "│");
    lines.push("└─────────────────────────────────────────────────────────────┘");

    console.log(lines.join("\n"));
  }

  /**
   * Format the action display string.
   */
  private formatActionDisplay(context: ApprovalContext): string {
    const { action, params } = context;

    switch (action) {
      case "write_file": {
        const content = (params as { content?: string }).content;
        if (!content || content.trim() === "") {
          return "write_file (delete)";
        }
        return "write_file";
      }
      case "task_complete":
        return "task_complete";
      case "chain_close":
        return "chain_close";
      case "spawn_session":
        return "spawn_session (nested)";
      default:
        return action;
    }
  }

  /**
   * Wait for user approval with timeout.
   */
  private async waitForApproval(): Promise<ApprovalResult> {
    return new Promise((resolve) => {
      let rl: Interface | null = null;
      let timeoutId: NodeJS.Timeout | null = null;
      let resolved = false;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (rl) {
          rl.close();
          rl = null;
        }
      };

      const doResolve = (result: ApprovalResult) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(result);
      };

      // Set up timeout
      timeoutId = setTimeout(() => {
        doResolve({ approved: false, reason: "timeout" });
      }, this.config.approvalTimeoutMs);

      // Set up readline for user input
      rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      // Prompt for input
      rl.question("", (answer) => {
        const normalized = answer.trim().toLowerCase();
        if (normalized === "y" || normalized === "yes") {
          doResolve({ approved: true });
        } else {
          doResolve({ approved: false, reason: "rejected" });
        }
      });

      // Handle readline close (e.g., Ctrl+C)
      rl.on("close", () => {
        doResolve({ approved: false, reason: "rejected" });
      });
    });
  }
}

/**
 * Create a checkpoint handler with default configuration.
 * @param config - Partial configuration
 * @param onRejection - Optional callback for rejections
 */
export function createCheckpointHandler(
  config: Partial<CheckpointConfig> = {},
  onRejection?: ApprovalCallback
): CheckpointHandler {
  return new CheckpointHandler(config, onRejection);
}

/**
 * Default checkpoint handler (no approval required).
 */
export const defaultCheckpointHandler = new CheckpointHandler();

/**
 * Get default approval timeout from environment variable.
 * @returns Timeout in milliseconds
 */
export function getApprovalTimeoutFromEnv(): number {
  const envValue = process.env.CHORAGEN_APPROVAL_TIMEOUT;
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      // Assume value is in seconds if < 1000, otherwise milliseconds
      return parsed < 1000 ? parsed * 1000 : parsed;
    }
  }
  return DEFAULT_APPROVAL_TIMEOUT_MS;
}

/**
 * Default approval timeout in milliseconds.
 */
export const DEFAULT_APPROVAL_TIMEOUT = DEFAULT_APPROVAL_TIMEOUT_MS;
