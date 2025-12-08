// ADR: ADR-010-agent-runtime-architecture

/**
 * Agent runtime CLI command.
 * Provides the `agent:start` command for starting agent sessions.
 */

import { MetricsCollector } from "@choragen/core";
import {
  runAgentSession,
  createProvider,
  getApiKeyFromEnv,
  getProviderFromEnv,
  ProviderError,
  DEFAULT_MODELS,
  Session,
  type AgentRole,
  type ProviderName,
  type SessionResult,
  type ToolCallRecord,
} from "../runtime/index.js";

/**
 * Options for the agent:start command.
 */
export interface AgentStartOptions {
  role: AgentRole;
  provider?: ProviderName;
  model?: string;
  chain?: string;
  task?: string;
  dryRun?: boolean;
}

/**
 * Parse agent:start command arguments.
 * @param args - Command line arguments
 * @returns Parsed options or error message
 */
export function parseAgentStartArgs(
  args: string[]
): { success: true; options: AgentStartOptions } | { success: false; error: string } {
  let role: AgentRole | undefined;
  let provider: ProviderName | undefined;
  let model: string | undefined;
  let chain: string | undefined;
  let task: string | undefined;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // --role=<value> or --role <value>
    if (arg === "--role" && args[i + 1]) {
      const value = args[++i];
      if (value !== "impl" && value !== "control") {
        return { success: false, error: `Invalid role: ${value}. Must be 'impl' or 'control'.` };
      }
      role = value;
    } else if (arg.startsWith("--role=")) {
      const value = arg.slice("--role=".length);
      if (value !== "impl" && value !== "control") {
        return { success: false, error: `Invalid role: ${value}. Must be 'impl' or 'control'.` };
      }
      role = value;
    }
    // --provider=<value> or --provider <value>
    else if (arg === "--provider" && args[i + 1]) {
      const value = args[++i];
      if (value !== "anthropic" && value !== "openai" && value !== "gemini") {
        return { success: false, error: `Invalid provider: ${value}. Must be 'anthropic', 'openai', or 'gemini'.` };
      }
      provider = value;
    } else if (arg.startsWith("--provider=")) {
      const value = arg.slice("--provider=".length);
      if (value !== "anthropic" && value !== "openai" && value !== "gemini") {
        return { success: false, error: `Invalid provider: ${value}. Must be 'anthropic', 'openai', or 'gemini'.` };
      }
      provider = value;
    }
    // --model=<value> or --model <value>
    else if (arg === "--model" && args[i + 1]) {
      model = args[++i];
    } else if (arg.startsWith("--model=")) {
      model = arg.slice("--model=".length);
    }
    // --chain=<value> or --chain <value>
    else if (arg === "--chain" && args[i + 1]) {
      chain = args[++i];
    } else if (arg.startsWith("--chain=")) {
      chain = arg.slice("--chain=".length);
    }
    // --task=<value> or --task <value>
    else if (arg === "--task" && args[i + 1]) {
      task = args[++i];
    } else if (arg.startsWith("--task=")) {
      task = arg.slice("--task=".length);
    }
    // --dry-run
    else if (arg === "--dry-run") {
      dryRun = true;
    }
    // --help
    else if (arg === "--help" || arg === "-h") {
      return { success: false, error: "SHOW_HELP" };
    }
    // Unknown flag
    else if (arg.startsWith("-")) {
      return { success: false, error: `Unknown option: ${arg}` };
    }
  }

  // Role is required
  if (!role) {
    return { success: false, error: "Missing required option: --role" };
  }

  return {
    success: true,
    options: { role, provider, model, chain, task, dryRun },
  };
}

/**
 * Format the session header box.
 */
function formatSessionHeader(
  role: AgentRole,
  model: string,
  sessionId: string,
  dryRun: boolean
): string {
  const width = 63;
  const border = "═".repeat(width);

  const title = "CHORAGEN AGENT RUNTIME" + (dryRun ? " (DRY RUN)" : "");
  const roleLine = `Role: ${role} | Model: ${model}`;
  const sessionLine = `Session: ${sessionId}`;

  const padLine = (text: string): string => {
    const padding = width - text.length - 2;
    return "║  " + text + " ".repeat(Math.max(0, padding)) + "║";
  };

  return [
    "╔" + border + "╗",
    padLine(title),
    padLine(roleLine),
    padLine(sessionLine),
    "╠" + border + "╣",
  ].join("\n");
}

/**
 * Format a tool call for display.
 */
function formatToolCall(record: ToolCallRecord): string {
  const lines: string[] = [];
  const argsStr = JSON.stringify(record.arguments);
  const truncatedArgs = argsStr.length > 60 ? argsStr.slice(0, 57) + "..." : argsStr;

  lines.push(`> tool: ${record.name} ${truncatedArgs}`);

  if (!record.allowed) {
    lines.push(`> DENIED: ${record.denialReason}`);
  } else if (record.result) {
    if (record.result.success) {
      const dataStr = record.result.data ? JSON.stringify(record.result.data) : "ok";
      const truncatedData = dataStr.length > 60 ? dataStr.slice(0, 57) + "..." : dataStr;
      lines.push(`> result: ${truncatedData}`);
    } else {
      lines.push(`> error: ${record.result.error}`);
    }
  }

  return lines.join("\n");
}

/**
 * Format duration in human-readable format.
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Format the session summary.
 */
function formatSessionSummary(
  result: SessionResult,
  durationMs: number
): string {
  const status = result.success ? "Session complete." : `Session failed: ${result.error}`;
  const duration = formatDuration(durationMs);
  const tokens = `${result.tokensUsed.input.toLocaleString()} in / ${result.tokensUsed.output.toLocaleString()} out`;

  return `\n${status}\nDuration: ${duration} | Tokens: ${tokens}`;
}

/**
 * Get help text for agent:start command.
 */
export function getAgentStartHelp(): string {
  return `
Usage: choragen agent:start --role=<impl|control> [options]

Start an agent session with the specified role.

Required:
  --role=<impl|control>    Agent role (impl for implementation, control for management)

Options:
  --provider=<name>        LLM provider: anthropic, openai, gemini (default: from CHORAGEN_PROVIDER or anthropic)
  --model=<name>           Model to use (default: provider's default model)
  --chain=<id>             Chain ID for context
  --task=<id>              Task ID for context (requires --chain)
  --dry-run                Validate but don't execute tool calls
  --help, -h               Show this help message

Environment Variables:
  CHORAGEN_PROVIDER        Default provider (anthropic, openai, gemini)
  CHORAGEN_MODEL           Default model name
  ANTHROPIC_API_KEY        API key for Anthropic
  OPENAI_API_KEY           API key for OpenAI
  GEMINI_API_KEY           API key for Gemini

Examples:
  # Start control agent with defaults
  choragen agent:start --role=control

  # Start impl agent for a specific task
  choragen agent:start --role=impl --chain=CHAIN-037 --task=001-provider-abstraction

  # Use OpenAI with specific model
  choragen agent:start --role=control --provider=openai --model=gpt-4o

  # Dry run to see what would happen
  choragen agent:start --role=control --dry-run
`.trim();
}

/**
 * Run the agent:start command.
 * @param args - Command line arguments
 * @param workspaceRoot - Workspace root directory
 */
export async function runAgentStart(
  args: string[],
  workspaceRoot: string
): Promise<void> {
  // Parse arguments
  const parseResult = parseAgentStartArgs(args);

  if (!parseResult.success) {
    if (parseResult.error === "SHOW_HELP") {
      console.log(getAgentStartHelp());
      return;
    }
    console.error(`Error: ${parseResult.error}`);
    console.error("Run 'choragen agent:start --help' for usage information.");
    process.exit(1);
  }

  const { role, provider: providerOverride, model: modelOverride, chain, task, dryRun } = parseResult.options;

  // Determine provider
  const providerName = providerOverride ?? getProviderFromEnv() ?? "anthropic";

  // Check for API key
  const apiKey = getApiKeyFromEnv(providerName);
  if (!apiKey) {
    const envVar = providerName === "anthropic" ? "ANTHROPIC_API_KEY" :
                   providerName === "openai" ? "OPENAI_API_KEY" : "GEMINI_API_KEY";
    console.error(`Error: API key not found for provider '${providerName}'.`);
    console.error(`Set the ${envVar} environment variable.`);
    process.exit(1);
  }

  // Determine model
  const model = modelOverride ?? process.env.CHORAGEN_MODEL ?? DEFAULT_MODELS[providerName];

  // Create provider
  let llmProvider;
  try {
    llmProvider = createProvider(providerName, { apiKey, model });
  } catch (err) {
    if (err instanceof ProviderError) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  // Create session for tracking
  const session = new Session({
    role,
    model,
    chainId: chain,
    taskId: task,
    workspaceRoot,
  });

  // Display header
  console.log(formatSessionHeader(role, model, session.id, dryRun ?? false));
  console.log("");

  // Track start time
  const startTime = Date.now();

  // Track tool calls for display
  let lastToolCallCount = 0;

  // Create a custom console logger to intercept loop output
  const originalLog = console.log;
  console.log = (...logArgs: unknown[]) => {
    const message = logArgs.join(" ");
    // Filter out internal loop messages, we'll format our own
    if (message.startsWith("[Loop]")) {
      // Extract tool call info if present
      if (message.includes("Tool call:")) {
        const toolName = message.replace("[Loop] Tool call: ", "");
        originalLog(`[Agent] Calling ${toolName}...`);
      } else if (message.includes("DENIED:")) {
        originalLog(message.replace("[Loop] ", ""));
      } else if (message.includes("DRY RUN:")) {
        originalLog(message.replace("[Loop] ", ""));
      }
      // Skip other loop messages
      return;
    }
    originalLog(...logArgs);
  };

  try {
    // Run the session
    const result = await runAgentSession({
      role,
      provider: llmProvider,
      chainId: chain,
      taskId: task,
      workspaceRoot,
      dryRun,
    });

    // Restore console.log
    console.log = originalLog;

    // Display tool calls that happened
    for (let i = lastToolCallCount; i < result.toolCalls.length; i++) {
      console.log(formatToolCall(result.toolCalls[i]));
    }

    // Calculate duration
    const durationMs = Date.now() - startTime;

    // Display summary
    console.log(formatSessionSummary(result, durationMs));

    // Update session and save
    session.updateTokenUsage(result.tokensUsed.input, result.tokensUsed.output);
    await session.end(result.success ? "success" : "failure");

    // Record metrics - use task:completed if we have a task context
    if (task && chain) {
      const metricsCollector = new MetricsCollector(workspaceRoot);
      try {
        await metricsCollector.record({
          eventType: "task:completed",
          entityType: "task",
          entityId: task,
          chainId: chain,
          model,
          tokens: {
            input: result.tokensUsed.input,
            output: result.tokensUsed.output,
          },
          metadata: {
            sessionId: session.id,
            role,
            provider: providerName,
            dryRun: dryRun ?? false,
            success: result.success,
            iterations: result.iterations,
            stopReason: result.stopReason,
            toolCallCount: result.toolCalls.length,
          },
        });
      } catch {
        // Gracefully ignore metrics errors
      }
    }

    // Exit with appropriate code
    if (!result.success) {
      process.exit(1);
    }
  } catch (err) {
    // Restore console.log
    console.log = originalLog;

    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`\nSession error: ${errorMessage}`);

    // Record failure
    await session.end("failure");

    process.exit(1);
  }
}
