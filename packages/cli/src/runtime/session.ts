// ADR: ADR-010-agent-runtime-architecture

/**
 * Session state persistence for agent runtime.
 * Provides audit trail and enables future session resume capability.
 */

import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { AgentRole } from "./tools/types.js";
import type { Message } from "./providers/types.js";

/**
 * Session outcome status.
 */
export type SessionOutcome = "success" | "failure" | "interrupted";

/**
 * Token usage statistics for a session.
 */
export interface SessionTokenUsage {
  input: number;
  output: number;
  total: number;
}

/**
 * Governance validation result for a tool call.
 */
export interface SessionGovernanceResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Record of a tool call made during the session.
 */
export interface SessionToolCall {
  timestamp: string;
  name: string;
  params: Record<string, unknown>;
  result: {
    success: boolean;
    data?: unknown;
    error?: string;
  };
  governanceResult: SessionGovernanceResult;
}

/**
 * Serializable session data structure.
 */
export interface SessionData {
  id: string;
  role: AgentRole;
  model: string;
  chainId: string | null;
  taskId: string | null;
  startTime: string;
  endTime: string | null;
  outcome: SessionOutcome | null;
  tokenUsage: SessionTokenUsage;
  messages: Message[];
  toolCalls: SessionToolCall[];
  /** Parent session ID (for nested sessions) */
  parentSessionId: string | null;
  /** Child session IDs (for tracking spawned sessions) */
  childSessionIds: string[];
  /** Nesting depth (0 = root session) */
  nestingDepth: number;
}

/**
 * Configuration for creating a new session.
 */
export interface SessionConfig {
  role: AgentRole;
  model: string;
  chainId?: string;
  taskId?: string;
  workspaceRoot: string;
  /** Parent session ID (for nested sessions) */
  parentSessionId?: string;
  /** Nesting depth (0 = root session) */
  nestingDepth?: number;
}

/**
 * Default sessions directory relative to workspace root.
 */
const SESSIONS_DIR = ".choragen/sessions";

/**
 * Generate a unique session ID.
 * Format: session-YYYYMMDD-HHMMSS-xxxxxx
 */
function generateSessionId(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timePart = now.toISOString().slice(11, 19).replace(/:/g, "");
  const randomPart = randomBytes(3).toString("hex");
  return `session-${datePart}-${timePart}-${randomPart}`;
}

/**
 * Internal constructor arguments for Session.
 */
interface SessionConstructorArgs {
  data: SessionData;
  sessionsDir: string;
  filePath: string;
}

/**
 * Session state manager for agent runtime.
 * Tracks session metadata, messages, tool calls, and token usage.
 * Persists to .choragen/sessions/{session-id}.json for audit trail.
 */
export class Session {
  private readonly data: SessionData;
  private readonly sessionsDir: string;
  private readonly filePath: string;

  /**
   * Create a new session or restore from existing data.
   * @param configOrArgs - Session configuration or internal constructor args
   */
  constructor(configOrArgs: SessionConfig | SessionConstructorArgs) {
    if ("data" in configOrArgs) {
      // Internal constructor for loading existing sessions
      this.data = configOrArgs.data;
      this.sessionsDir = configOrArgs.sessionsDir;
      this.filePath = configOrArgs.filePath;
    } else {
      // Public constructor for new sessions
      const config = configOrArgs;
      const id = generateSessionId();
      this.sessionsDir = join(config.workspaceRoot, SESSIONS_DIR);
      this.filePath = join(this.sessionsDir, `${id}.json`);

      this.data = {
        id,
        role: config.role,
        model: config.model,
        chainId: config.chainId ?? null,
        taskId: config.taskId ?? null,
        startTime: new Date().toISOString(),
        endTime: null,
        outcome: null,
        tokenUsage: { input: 0, output: 0, total: 0 },
        messages: [],
        toolCalls: [],
        parentSessionId: config.parentSessionId ?? null,
        childSessionIds: [],
        nestingDepth: config.nestingDepth ?? 0,
      };
    }
  }

  /**
   * Create a Session instance from existing data.
   */
  private static fromData(
    data: SessionData,
    workspaceRoot: string
  ): Session {
    const sessionsDir = join(workspaceRoot, SESSIONS_DIR);
    const filePath = join(sessionsDir, `${data.id}.json`);
    return new Session({ data, sessionsDir, filePath });
  }

  /**
   * Load an existing session from disk.
   * @param sessionId - Session ID to load
   * @param workspaceRoot - Workspace root directory
   * @returns Loaded session or null if not found
   */
  static async load(
    sessionId: string,
    workspaceRoot: string
  ): Promise<Session | null> {
    const filePath = join(workspaceRoot, SESSIONS_DIR, `${sessionId}.json`);
    try {
      const content = await readFile(filePath, "utf-8");
      const data = JSON.parse(content) as SessionData;
      return Session.fromData(data, workspaceRoot);
    } catch {
      return null;
    }
  }

  /**
   * Get the session ID.
   */
  get id(): string {
    return this.data.id;
  }

  /**
   * Get the agent role.
   */
  get role(): AgentRole {
    return this.data.role;
  }

  /**
   * Get the model name.
   */
  get model(): string {
    return this.data.model;
  }

  /**
   * Get the chain ID.
   */
  get chainId(): string | null {
    return this.data.chainId;
  }

  /**
   * Get the task ID.
   */
  get taskId(): string | null {
    return this.data.taskId;
  }

  /**
   * Get the start time.
   */
  get startTime(): string {
    return this.data.startTime;
  }

  /**
   * Get the end time.
   */
  get endTime(): string | null {
    return this.data.endTime;
  }

  /**
   * Get the session outcome.
   */
  get outcome(): SessionOutcome | null {
    return this.data.outcome;
  }

  /**
   * Get the token usage.
   */
  get tokenUsage(): SessionTokenUsage {
    return { ...this.data.tokenUsage };
  }

  /**
   * Get the messages array (copy).
   */
  get messages(): Message[] {
    return [...this.data.messages];
  }

  /**
   * Get the tool calls array (copy).
   */
  get toolCalls(): SessionToolCall[] {
    return [...this.data.toolCalls];
  }

  /**
   * Get the parent session ID.
   */
  get parentSessionId(): string | null {
    return this.data.parentSessionId;
  }

  /**
   * Get the child session IDs (copy).
   */
  get childSessionIds(): string[] {
    return [...this.data.childSessionIds];
  }

  /**
   * Get the nesting depth.
   */
  get nestingDepth(): number {
    return this.data.nestingDepth;
  }

  /**
   * Check if this is a root session (no parent).
   */
  get isRootSession(): boolean {
    return this.data.parentSessionId === null;
  }

  /**
   * Add a message to the session.
   * @param message - Message to add
   */
  addMessage(message: Message): void {
    this.data.messages.push(message);
  }

  /**
   * Record a tool call.
   * Auto-saves after recording for crash recovery.
   * @param toolCall - Tool call to record
   */
  async recordToolCall(toolCall: SessionToolCall): Promise<void> {
    this.data.toolCalls.push(toolCall);
    await this.save();
  }

  /**
   * Update token usage.
   * @param input - Input tokens to add
   * @param output - Output tokens to add
   */
  updateTokenUsage(input: number, output: number): void {
    this.data.tokenUsage.input += input;
    this.data.tokenUsage.output += output;
    this.data.tokenUsage.total = this.data.tokenUsage.input + this.data.tokenUsage.output;
  }

  /**
   * End the session with an outcome.
   * @param outcome - Session outcome
   */
  async end(outcome: SessionOutcome): Promise<void> {
    this.data.endTime = new Date().toISOString();
    this.data.outcome = outcome;
    await this.save();
  }

  /**
   * Add a child session ID to this session.
   * @param childSessionId - ID of the child session
   */
  async addChildSession(childSessionId: string): Promise<void> {
    this.data.childSessionIds.push(childSessionId);
    await this.save();
  }

  /**
   * Save the session to disk.
   * Creates the sessions directory if it doesn't exist.
   */
  async save(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const content = JSON.stringify(this.data, null, 2);
    await writeFile(this.filePath, content, "utf-8");
  }

  /**
   * Get the session data as a plain object.
   * Useful for serialization or inspection.
   */
  toJSON(): SessionData {
    return {
      ...this.data,
      tokenUsage: { ...this.data.tokenUsage },
      messages: [...this.data.messages],
      toolCalls: [...this.data.toolCalls],
      childSessionIds: [...this.data.childSessionIds],
    };
  }
}
