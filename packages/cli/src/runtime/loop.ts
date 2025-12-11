// ADR: ADR-010-agent-runtime-architecture

/**
 * Core agentic loop that orchestrates LLM calls, tool execution, and governance validation.
 * Phase 2: Supports nested sessions for control-to-impl delegation.
 */

import { randomUUID } from "node:crypto";
import type { AgentRole } from "./tools/types.js";
import type { LLMProvider, Message, Tool, ToolCall } from "./providers/types.js";
import { ToolRegistry, defaultRegistry } from "./tools/registry.js";
import { ToolExecutor, defaultExecutor, type ChildSessionConfig, type ChildSessionResult } from "./tools/executor.js";
import { GovernanceGate, defaultGovernanceGate } from "./governance-gate.js";
import { PromptLoader, createToolSummaries } from "./prompt-loader.js";
import { withRetry, DEFAULT_RETRY_CONFIG, type RetryConfig } from "./retry.js";
import { CostTracker, type CostSnapshot } from "./cost-tracker.js";
import { CheckpointHandler, type CheckpointConfig } from "./checkpoint.js";
import { loadWorkflowSessionContext } from "./context.js";
import type { MessageRole, StageType, WorkflowMessageMetadata } from "@choragen/core";

/**
 * Default maximum iterations for safety limit.
 */
const DEFAULT_MAX_ITERATIONS = 50;

/**
 * Default maximum nesting depth for nested sessions.
 */
const DEFAULT_MAX_NESTING_DEPTH = 2;

/**
 * Configuration for an agent session.
 */
export interface AgentSessionConfig {
  /** Agent role (control or impl) */
  role: AgentRole;
  /** LLM provider instance */
  provider: LLMProvider;
  /** Active chain ID (optional) */
  chainId?: string;
  /** Active task ID (optional) */
  taskId?: string;
  /** Workflow ID (optional) */
  workflowId?: string;
  /** Workflow stage index (optional, defaults to workflow.currentStage) */
  stageIndex?: number;
  /** Workspace root directory */
  workspaceRoot: string;
  /** Maximum iterations before forced termination (default: 50) */
  maxIterations?: number;
  /** Dry run mode - validate but don't execute tools */
  dryRun?: boolean;
  /** Parent session ID (for nested sessions) */
  parentSessionId?: string;
  /** Current nesting depth (0 = root session) */
  nestingDepth?: number;
  /** Maximum nesting depth (default: 2) */
  maxNestingDepth?: number;
  /** Additional context passed from parent session */
  parentContext?: string;
  /** Retry configuration for LLM calls (default: enabled with 3 retries) */
  retryConfig?: Partial<RetryConfig>;
  /** Maximum total tokens (input + output), undefined = no limit */
  maxTokens?: number;
  /** Maximum cost in USD, undefined = no limit */
  maxCost?: number;
  /** Checkpoint configuration for human-in-the-loop approval */
  checkpointConfig?: Partial<CheckpointConfig>;
}

/**
 * Record of a tool call made during the session.
 */
export interface ToolCallRecord {
  /** Tool name */
  name: string;
  /** Tool arguments */
  arguments: Record<string, unknown>;
  /** Whether the call was allowed by governance */
  allowed: boolean;
  /** Governance denial reason (if denied) */
  denialReason?: string;
  /** Tool execution result (if allowed and executed) */
  result?: {
    success: boolean;
    data?: unknown;
    error?: string;
  };
  /** Timestamp of the call */
  timestamp: string;
}

/**
 * Result of an agent session.
 */
export interface SessionResult {
  /** Whether the session completed successfully */
  success: boolean;
  /** Number of LLM iterations */
  iterations: number;
  /** Record of all tool calls made */
  toolCalls: ToolCallRecord[];
  /** Token usage statistics */
  tokensUsed: { input: number; output: number };
  /** Error message (if session failed) */
  error?: string;
  /** Stop reason (end_turn, max_iterations, error, max_depth, cost_limit) */
  stopReason: "end_turn" | "max_iterations" | "error" | "max_depth" | "cost_limit" | "paused";
  /** Cost tracking snapshot at end of session */
  costSnapshot?: CostSnapshot;
  /** Session ID */
  sessionId: string;
  /** Child session results (for nested sessions) */
  childSessions?: SessionResult[];
}

/**
 * Dependencies for the agentic loop (injectable for testing).
 */
export interface LoopDependencies {
  registry?: ToolRegistry;
  executor?: ToolExecutor;
  governanceGate?: GovernanceGate;
  promptLoader?: PromptLoader;
  checkpointHandler?: CheckpointHandler;
}

/**
 * Extended execution context for nested session support.
 * Includes all base ExecutionContext fields plus nested session metadata.
 */
export interface ExtendedExecutionContext {
  /** Role of the agent executing the tool */
  role: AgentRole;
  /** Current chain ID (if in a chain context) */
  chainId?: string;
  /** Current task ID (if in a task context) */
  taskId?: string;
  /** Workflow ID (if in a workflow context) */
  workflowId?: string;
  /** Workflow stage type (if in a workflow context) */
  stageType?: StageType;
  /** Workspace root directory */
  workspaceRoot: string;
  /** Current session ID */
  sessionId: string;
  /** Parent session ID (for nested sessions) */
  parentSessionId?: string;
  /** Current nesting depth */
  nestingDepth: number;
  /** Maximum nesting depth */
  maxNestingDepth: number;
  /** LLM provider (for spawning child sessions) */
  provider: LLMProvider;
  /** Dependencies (for spawning child sessions) */
  deps: LoopDependencies;
  /** Array to collect child session results */
  childSessionResults: SessionResult[];
  /** Function to spawn a child session */
  spawnChildSession: (config: ChildSessionConfig) => Promise<ChildSessionResult>;
}

/**
 * Run an agent session with the agentic loop.
 *
 * The loop:
 * 1. Loads the system prompt for the role
 * 2. Gets available tools for the role
 * 3. Calls the LLM with conversation history and tools
 * 4. For each tool call:
 *    - Validates against governance rules
 *    - Executes if allowed, adds error message if denied
 * 5. Adds tool results to conversation history
 * 6. Repeats until end_turn or max iterations
 *
 * @param config - Session configuration
 * @param deps - Optional dependencies for testing
 * @returns Session result with summary
 */
export async function runAgentSession(
  config: AgentSessionConfig,
  deps: LoopDependencies = {}
): Promise<SessionResult> {
  const {
    role,
    provider,
    chainId,
    taskId,
    workflowId,
    stageIndex,
    workspaceRoot,
    maxIterations = DEFAULT_MAX_ITERATIONS,
    dryRun = false,
    parentSessionId,
    nestingDepth = 0,
    maxNestingDepth = DEFAULT_MAX_NESTING_DEPTH,
    parentContext,
    retryConfig,
    maxTokens,
    maxCost,
    checkpointConfig,
  } = config;

  // Merge retry config with defaults
  const effectiveRetryConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...retryConfig,
  };

  // Use provided dependencies or defaults
  const registry = deps.registry ?? defaultRegistry;
  const executor = deps.executor ?? defaultExecutor;
  const governanceGate = deps.governanceGate ?? defaultGovernanceGate;
  const promptLoader = deps.promptLoader ?? new PromptLoader(workspaceRoot);

  // Check nesting depth limit
  if (nestingDepth > maxNestingDepth) {
    console.error(`[Loop] Maximum nesting depth (${maxNestingDepth}) exceeded`);
    return {
      success: false,
      iterations: 0,
      toolCalls: [],
      tokensUsed: { input: 0, output: 0 },
      error: `Maximum nesting depth (${maxNestingDepth}) exceeded`,
      stopReason: "max_depth",
      sessionId: randomUUID(),
    };
  }

  // Session state
  const sessionId = randomUUID();
  const checkpointHandler = deps.checkpointHandler ?? new CheckpointHandler({
    ...checkpointConfig,
    sessionId,
  });
  const toolCallRecords: ToolCallRecord[] = [];
  const childSessionResults: SessionResult[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let iterations = 0;

  // Initialize cost tracker
  const costTracker = new CostTracker({
    model: provider.model,
    maxTokens,
    maxCost,
  });

  // Load workflow context if provided
  let workflowContext: Awaited<ReturnType<typeof loadWorkflowSessionContext>> = null;
  if (workflowId) {
    try {
      workflowContext = await loadWorkflowSessionContext(workspaceRoot, workflowId, stageIndex);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Loop] Workflow load failed: ${message}`);
      return {
        success: false,
        iterations: 0,
        toolCalls: [],
        tokensUsed: { input: 0, output: 0 },
        error: message,
        stopReason: "error",
        sessionId,
      };
    }
  }

  const workflowMessageRole: MessageRole = role === "impl" ? "impl" : "control";
  const recordWorkflowMessage = async (
    messageRole: MessageRole,
    content: string,
    metadata?: WorkflowMessageMetadata
  ): Promise<void> => {
    if (!workflowContext) return;
    try {
      await workflowContext.manager.addMessage(workflowContext.workflow.id, {
        role: messageRole,
        content,
        stageIndex: workflowContext.stageIndex,
        metadata,
      });
    } catch (err) {
      console.error(
        `[Loop] Failed to record workflow message: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  // Get tools for role
  const stageType = workflowContext?.stageType;
  const toolDefinitions = stageType
    ? registry.getToolsForStage(role, stageType)
    : registry.getToolsForRole(role);
  const tools: Tool[] = stageType
    ? registry.getProviderToolsForStage(role, stageType)
    : registry.getProviderToolsForRole(role);

  // Build system prompt
  const systemPrompt = await promptLoader.load(role, {
    sessionId,
    chainId,
    taskId,
    workspaceRoot,
    availableTools: createToolSummaries(toolDefinitions),
  });

  // Initialize conversation with system prompt
  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: buildInitialUserMessage(role, chainId, taskId, parentContext),
    },
  ];

  // Create the spawn child session function
  const spawnChildSession = async (childConfig: ChildSessionConfig): Promise<ChildSessionResult> => {
    console.log(`[Loop] Spawning child impl session for task ${childConfig.taskId}`);
    
    // Run a nested agent session
    const childResult = await runAgentSession(
      {
        role: "impl",
        provider,
        chainId: childConfig.chainId,
        taskId: childConfig.taskId,
        workspaceRoot,
        maxIterations,
        dryRun,
        parentSessionId: sessionId,
        nestingDepth: nestingDepth + 1,
        maxNestingDepth,
        parentContext: childConfig.context,
      },
      deps
    );

    // Track the child session result
    childSessionResults.push(childResult);

    // Return a summary for the parent session
    return {
      success: childResult.success,
      sessionId: childResult.sessionId,
      iterations: childResult.iterations,
      tokensUsed: childResult.tokensUsed,
      error: childResult.error,
      summary: childResult.success
        ? `Impl session completed in ${childResult.iterations} iterations`
        : `Impl session failed: ${childResult.error}`,
    };
  };

  // Execution context for tools (extended for nested sessions)
  const executionContext: ExtendedExecutionContext = {
    role,
    chainId,
    taskId,
    workflowId: workflowContext?.workflow.id,
    stageType,
    workspaceRoot,
    sessionId,
    parentSessionId,
    nestingDepth,
    maxNestingDepth,
    provider,
    deps,
    childSessionResults,
    spawnChildSession,
  };

  try {
    // Main loop
    while (iterations < maxIterations) {
      iterations++;

      // Log iteration start
      console.log(`[Loop] Iteration ${iterations}/${maxIterations}`);

      // Call LLM with retry
      const retryResult = await withRetry(
        () => provider.chat(messages, tools),
        effectiveRetryConfig
      );

      // Check if LLM call failed after all retries
      if (!retryResult.success) {
        const errorMessage = retryResult.error?.message ?? "Unknown LLM error";
        const retryInfo = retryResult.wasRetryable
          ? ` (retried ${retryResult.attempts - 1} times)`
          : " (non-retryable)";
        console.error(`[Loop] LLM call failed${retryInfo}: ${errorMessage}`);
        throw retryResult.error ?? new Error(errorMessage);
      }

      const response = retryResult.data!;

      // Track token usage
      totalInputTokens += response.usage.inputTokens;
      totalOutputTokens += response.usage.outputTokens;
      costTracker.addUsage(response.usage.inputTokens, response.usage.outputTokens);

      // Log turn summary with cost info
      if (costTracker.hasLimits()) {
        console.log(`[Loop] ${costTracker.formatTurnSummary(iterations)}`);
      }

      // Check cost limits
      const limitCheck = costTracker.checkLimits();
      if (limitCheck.exceeded) {
        console.log(`[Loop] Session ended: cost_limit - ${limitCheck.message}`);
        return {
          success: false,
          iterations,
          toolCalls: toolCallRecords,
          tokensUsed: { input: totalInputTokens, output: totalOutputTokens },
          error: limitCheck.message ?? "Cost limit exceeded",
          stopReason: "cost_limit",
          sessionId,
          costSnapshot: costTracker.getSnapshot(),
          childSessions: childSessionResults.length > 0 ? childSessionResults : undefined,
        };
      }
      if (limitCheck.warning) {
        console.log(`[Loop] WARNING: ${limitCheck.message}`);
      }

      // Add assistant response to history
      if (response.content) {
        messages.push({ role: "assistant", content: response.content });
        console.log(`[Loop] Assistant: ${response.content.slice(0, 100)}...`);
        await recordWorkflowMessage(workflowMessageRole, response.content);
      }

      // Process tool calls
      for (const toolCall of response.toolCalls) {
        const record = await processToolCall(
          toolCall,
          role,
          governanceGate,
          executor,
          executionContext,
          dryRun,
          checkpointHandler
        );
        toolCallRecords.push(record);

        // Check if session was paused due to approval timeout
        if (checkpointHandler.paused) {
          console.log("[Loop] Session paused due to approval timeout");
          return {
            success: false,
            iterations,
            toolCalls: toolCallRecords,
            tokensUsed: { input: totalInputTokens, output: totalOutputTokens },
            error: "Session paused: approval timeout",
            stopReason: "paused",
            sessionId,
            costSnapshot: costTracker.getSnapshot(),
            childSessions: childSessionResults.length > 0 ? childSessionResults : undefined,
          };
        }

        // Add tool result to conversation
        const toolMessage = buildToolMessage(toolCall, record);
        messages.push(toolMessage);
        await recordWorkflowMessage("system", toolMessage.content, {
          tool: toolCall.name,
          allowed: record.allowed,
        });
      }

      // Check stop condition
      if (response.stopReason === "end_turn") {
        console.log("[Loop] Session ended: end_turn");
        return {
          success: true,
          iterations,
          toolCalls: toolCallRecords,
          tokensUsed: { input: totalInputTokens, output: totalOutputTokens },
          stopReason: "end_turn",
          sessionId,
          costSnapshot: costTracker.getSnapshot(),
          childSessions: childSessionResults.length > 0 ? childSessionResults : undefined,
        };
      }
    }

    // Max iterations reached
    console.log("[Loop] Session ended: max_iterations");
    return {
      success: false,
      iterations,
      toolCalls: toolCallRecords,
      tokensUsed: { input: totalInputTokens, output: totalOutputTokens },
      error: `Maximum iterations (${maxIterations}) reached`,
      stopReason: "max_iterations",
      sessionId,
      costSnapshot: costTracker.getSnapshot(),
      childSessions: childSessionResults.length > 0 ? childSessionResults : undefined,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[Loop] Session error: ${errorMessage}`);
    return {
      success: false,
      iterations,
      toolCalls: toolCallRecords,
      tokensUsed: { input: totalInputTokens, output: totalOutputTokens },
      error: errorMessage,
      stopReason: "error",
      sessionId,
      costSnapshot: costTracker.getSnapshot(),
      childSessions: childSessionResults.length > 0 ? childSessionResults : undefined,
    };
  }
}

/**
 * Process a single tool call through governance and execution.
 */
async function processToolCall(
  toolCall: ToolCall,
  role: AgentRole,
  governanceGate: GovernanceGate,
  executor: ToolExecutor,
  context: { role: AgentRole; chainId?: string; taskId?: string; workspaceRoot: string },
  dryRun: boolean,
  checkpointHandler: CheckpointHandler
): Promise<ToolCallRecord> {
  const timestamp = new Date().toISOString();

  console.log(`[Loop] Tool call: ${toolCall.name}`);

  // Validate against governance
  const validation = governanceGate.validate(
    { name: toolCall.name, params: toolCall.arguments },
    role
  );

  if (!validation.allowed) {
    console.log(`[Loop] DENIED: ${validation.reason}`);
    return {
      name: toolCall.name,
      arguments: toolCall.arguments,
      allowed: false,
      denialReason: validation.reason,
      timestamp,
    };
  }

  // Check if approval is required for this action
  if (checkpointHandler.requiresApproval(toolCall.name, toolCall.arguments)) {
    const approvalResult = await checkpointHandler.requestApproval(
      toolCall.name,
      toolCall.arguments
    );

    if (!approvalResult.approved) {
      const reason = approvalResult.reason === "timeout"
        ? "Action rejected: approval timeout"
        : "Action rejected by human operator";
      console.log(`[Loop] CHECKPOINT: ${reason}`);
      return {
        name: toolCall.name,
        arguments: toolCall.arguments,
        allowed: false,
        denialReason: reason,
        timestamp,
      };
    }
  }

  // Dry run mode - don't execute
  if (dryRun) {
    console.log(`[Loop] DRY RUN: Would execute ${toolCall.name}`);
    return {
      name: toolCall.name,
      arguments: toolCall.arguments,
      allowed: true,
      result: { success: true, data: { dryRun: true } },
      timestamp,
    };
  }

  // Execute the tool
  const result = await executor.execute(toolCall.name, toolCall.arguments, context);

  console.log(`[Loop] Result: ${result.success ? "success" : "failed"}`);

  return {
    name: toolCall.name,
    arguments: toolCall.arguments,
    allowed: true,
    result: {
      success: result.success,
      data: result.data,
      error: result.error,
    },
    timestamp,
  };
}

/**
 * Build a tool result message for the conversation.
 */
function buildToolMessage(toolCall: ToolCall, record: ToolCallRecord): Message {
  let content: string;

  if (!record.allowed) {
    content = JSON.stringify({
      error: `DENIED: ${record.denialReason}`,
      toolName: toolCall.name,
    });
  } else if (record.result) {
    content = JSON.stringify({
      success: record.result.success,
      data: record.result.data,
      error: record.result.error,
    });
  } else {
    content = JSON.stringify({ error: "No result available" });
  }

  return {
    role: "tool",
    content,
    toolCallId: toolCall.id,
    toolName: toolCall.name,
  };
}

/**
 * Build the initial user message based on session context.
 */
function buildInitialUserMessage(
  role: AgentRole,
  chainId?: string,
  taskId?: string,
  parentContext?: string
): string {
  const parts: string[] = [];

  if (role === "impl" && chainId && taskId) {
    parts.push(`You are assigned to work on task ${taskId} in chain ${chainId}.`);
    parts.push("Please read the task file and implement according to the acceptance criteria.");
  } else if (role === "control" && chainId) {
    parts.push(`You are managing chain ${chainId}.`);
    parts.push("Please review the chain status and take appropriate action.");
  } else if (role === "control") {
    parts.push("You are a control agent ready to manage work.");
    parts.push("What would you like me to help you with?");
  } else {
    parts.push("You are an implementation agent ready to work.");
    parts.push("What would you like me to help you with?");
  }

  // Add parent context if this is a nested session
  if (parentContext) {
    parts.push("\n\nAdditional context from parent session:");
    parts.push(parentContext);
  }

  return parts.join(" ");
}
