// ADR: ADR-010-agent-runtime-architecture

/**
 * Session state persistence for agent runtime.
 * Provides audit trail and enables future session resume capability.
 */

import { randomBytes } from "node:crypto";
import { appendFile, mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { AgentRole } from "./tools/types.js";
import type { Message } from "./providers/types.js";

/**
 * Default metrics directory relative to workspace root.
 */
const METRICS_DIR = ".choragen/metrics";

/**
 * Tools that should be audit logged (file operations).
 */
const FILE_OPERATION_TOOLS = new Set([
  "read_file",
  "write_file",
  "list_files",
  "search_files",
]);

/**
 * Entry in the audit log for file operations.
 */
export interface AuditLogEntry {
  timestamp: string;
  session: string;
  tool: string;
  path?: string;
  result: "success" | "error" | "denied";
  /** For read_file: number of lines returned */
  lines?: number;
  /** For write_file: create or modify */
  action?: "create" | "modify";
  /** For write_file: bytes written */
  bytes?: number;
  /** Governance outcome: pass or deny */
  governance?: "pass" | "deny";
  /** Denial reason if governance denied */
  reason?: string;
  /** For list_files: number of entries */
  count?: number;
  /** For search_files: number of matches */
  matches?: number;
}

/**
 * Audit logger for file operations.
 * Writes JSONL entries to .choragen/metrics/audit-{sessionId}.jsonl
 */
export class AuditLogger {
  private readonly sessionId: string;
  private readonly filePath: string;
  private readonly metricsDir: string;

  constructor(sessionId: string, workspaceRoot: string) {
    this.sessionId = sessionId;
    this.metricsDir = join(workspaceRoot, METRICS_DIR);
    this.filePath = join(this.metricsDir, `audit-${sessionId}.jsonl`);
  }

  /**
   * Check if a tool should be audit logged.
   */
  static shouldLog(toolName: string): boolean {
    return FILE_OPERATION_TOOLS.has(toolName);
  }

  /**
   * Log a file operation.
   * @param entry - Audit log entry (session and timestamp will be auto-filled)
   */
  async log(entry: Omit<AuditLogEntry, "timestamp" | "session">): Promise<void> {
    const fullEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      session: this.sessionId,
      ...entry,
    };

    await mkdir(this.metricsDir, { recursive: true });
    await appendFile(this.filePath, JSON.stringify(fullEntry) + "\n", "utf-8");
  }

  /**
   * Get the audit log file path.
   */
  getFilePath(): string {
    return this.filePath;
  }
}

/**
 * Session outcome status.
 */
export type SessionOutcome = "success" | "failure" | "interrupted";

/**
 * Session runtime status for crash recovery.
 */
export type SessionStatus = "running" | "paused" | "completed" | "failed";

/**
 * Error details captured when a session fails.
 */
export interface SessionError {
  message: string;
  stack?: string;
  recoverable: boolean;
}

/**
 * Summary of a session for listing purposes.
 */
export interface SessionSummary {
  id: string;
  role: AgentRole;
  status: SessionStatus;
  startTime: string;
  endTime: string | null;
  tokenUsage: SessionTokenUsage;
  chainId: string | null;
  taskId: string | null;
}

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
  /** Runtime status for crash recovery */
  status: SessionStatus;
  /** Error details if session failed */
  error?: SessionError;
  /** Index of the last completed turn for resume */
  lastTurnIndex: number;
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
        status: "running",
        lastTurnIndex: 0,
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
   * List all sessions in the workspace.
   * @param workspaceRoot - Workspace root directory
   * @returns Array of session summaries sorted by startTime (newest first)
   */
  static async listAll(workspaceRoot: string): Promise<SessionSummary[]> {
    const sessionsDir = join(workspaceRoot, SESSIONS_DIR);
    const summaries: SessionSummary[] = [];

    try {
      const files = await readdir(sessionsDir);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));

      for (const file of jsonFiles) {
        try {
          const filePath = join(sessionsDir, file);
          const content = await readFile(filePath, "utf-8");
          const data = JSON.parse(content) as SessionData;
          summaries.push({
            id: data.id,
            role: data.role,
            status: data.status,
            startTime: data.startTime,
            endTime: data.endTime,
            tokenUsage: { ...data.tokenUsage },
            chainId: data.chainId,
            taskId: data.taskId,
          });
        } catch {
          // Skip invalid session files
        }
      }
    } catch {
      // Sessions directory doesn't exist yet
      return [];
    }

    // Sort by startTime descending (newest first)
    return summaries.sort((a, b) => b.startTime.localeCompare(a.startTime));
  }

  /**
   * Clean up old session files.
   * @param workspaceRoot - Workspace root directory
   * @param olderThanDays - Delete sessions older than this many days
   * @returns Number of sessions deleted
   */
  static async cleanup(
    workspaceRoot: string,
    olderThanDays: number
  ): Promise<number> {
    const sessionsDir = join(workspaceRoot, SESSIONS_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffTime = cutoffDate.getTime();

    let deletedCount = 0;

    try {
      const files = await readdir(sessionsDir);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));

      for (const file of jsonFiles) {
        try {
          const filePath = join(sessionsDir, file);
          const fileStat = await stat(filePath);
          
          // Use file modification time to determine age
          if (fileStat.mtime.getTime() < cutoffTime) {
            await unlink(filePath);
            deletedCount++;
          }
        } catch {
          // Skip files that can't be accessed
        }
      }
    } catch {
      // Sessions directory doesn't exist
      return 0;
    }

    return deletedCount;
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
   * Get the session status.
   */
  get status(): SessionStatus {
    return this.data.status;
  }

  /**
   * Get the error details (if any).
   */
  get error(): SessionError | undefined {
    return this.data.error ? { ...this.data.error } : undefined;
  }

  /**
   * Get the last completed turn index.
   */
  get lastTurnIndex(): number {
    return this.data.lastTurnIndex;
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
    this.data.status = outcome === "success" ? "completed" : "failed";
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
   * Set the session status.
   * Auto-saves after status change for crash recovery.
   * @param status - New session status
   */
  async setStatus(status: SessionStatus): Promise<void> {
    this.data.status = status;
    await this.save();
  }

  /**
   * Mark the session as failed with error details.
   * Auto-saves after recording error for crash recovery.
   * @param error - Error details
   */
  async setFailed(error: SessionError): Promise<void> {
    this.data.status = "failed";
    this.data.error = error;
    await this.save();
  }

  /**
   * Increment the turn index after completing a turn.
   * Auto-saves for crash recovery.
   */
  async incrementTurnIndex(): Promise<void> {
    this.data.lastTurnIndex++;
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
