// ADR: ADR-010-agent-runtime-architecture

/**
 * Core agentic loop that orchestrates LLM calls, tool execution, and governance validation.
 * Phase 1: Single-session, non-streaming implementation.
 */

import { randomUUID } from "node:crypto";
import type { AgentRole } from "./tools/types.js";
import type { LLMProvider, Message, Tool, ToolCall } from "./providers/types.js";
import { ToolRegistry, defaultRegistry } from "./tools/registry.js";
import { ToolExecutor, defaultExecutor } from "./tools/executor.js";
import { GovernanceGate, defaultGovernanceGate } from "./governance-gate.js";
import { PromptLoader, createToolSummaries } from "./prompt-loader.js";

/**
 * Default maximum iterations for safety limit.
 */
const DEFAULT_MAX_ITERATIONS = 50;

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
  /** Workspace root directory */
  workspaceRoot: string;
  /** Maximum iterations before forced termination (default: 50) */
  maxIterations?: number;
  /** Dry run mode - validate but don't execute tools */
  dryRun?: boolean;
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
  /** Stop reason (end_turn, max_iterations, error) */
  stopReason: "end_turn" | "max_iterations" | "error";
}

/**
 * Dependencies for the agentic loop (injectable for testing).
 */
export interface LoopDependencies {
  registry?: ToolRegistry;
  executor?: ToolExecutor;
  governanceGate?: GovernanceGate;
  promptLoader?: PromptLoader;
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
    workspaceRoot,
    maxIterations = DEFAULT_MAX_ITERATIONS,
    dryRun = false,
  } = config;

  // Use provided dependencies or defaults
  const registry = deps.registry ?? defaultRegistry;
  const executor = deps.executor ?? defaultExecutor;
  const governanceGate = deps.governanceGate ?? defaultGovernanceGate;
  const promptLoader = deps.promptLoader ?? new PromptLoader(workspaceRoot);

  // Session state
  const sessionId = randomUUID();
  const toolCallRecords: ToolCallRecord[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let iterations = 0;

  // Get tools for role
  const toolDefinitions = registry.getToolsForRole(role);
  const tools: Tool[] = registry.getProviderToolsForRole(role);

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
      content: buildInitialUserMessage(role, chainId, taskId),
    },
  ];

  // Execution context for tools
  const executionContext = {
    role,
    chainId,
    taskId,
    workspaceRoot,
  };

  try {
    // Main loop
    while (iterations < maxIterations) {
      iterations++;

      // Log iteration start
      console.log(`[Loop] Iteration ${iterations}/${maxIterations}`);

      // Call LLM
      const response = await provider.chat(messages, tools);

      // Track token usage
      totalInputTokens += response.usage.inputTokens;
      totalOutputTokens += response.usage.outputTokens;

      // Add assistant response to history
      if (response.content) {
        messages.push({ role: "assistant", content: response.content });
        console.log(`[Loop] Assistant: ${response.content.slice(0, 100)}...`);
      }

      // Process tool calls
      for (const toolCall of response.toolCalls) {
        const record = await processToolCall(
          toolCall,
          role,
          governanceGate,
          executor,
          executionContext,
          dryRun
        );
        toolCallRecords.push(record);

        // Add tool result to conversation
        const toolMessage = buildToolMessage(toolCall, record);
        messages.push(toolMessage);
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
  dryRun: boolean
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
  taskId?: string
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

  return parts.join(" ");
}
