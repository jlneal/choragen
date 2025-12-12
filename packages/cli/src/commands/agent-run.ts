// ADR: ADR-010-agent-runtime-architecture

import { WorkflowManager } from "@choragen/core";
import {
  DEFAULT_MODELS,
  createProvider,
  getApiKeyFromEnv,
  getProviderFromEnv,
  ProviderError,
  runAgentSession,
  type AgentRole,
  type AgentSessionEvents,
  type ProviderName,
} from "../runtime/index.js";

interface AgentRunOptions {
  workflowId: string;
  stageIndex?: number;
  message?: string;
  role: AgentRole;
  provider?: ProviderName;
  model?: string;
}

const VALID_PROVIDERS: ProviderName[] = ["anthropic", "openai", "gemini", "ollama"];

function parseAgentRunArgs(
  args: string[]
): { success: true; options: AgentRunOptions } | { success: false; error: string } {
  let workflowId: string | undefined;
  let stageIndex: number | undefined;
  let message: string | undefined;
  let role: AgentRole = "impl";
  let provider: ProviderName | undefined;
  let model: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--workflow" && args[i + 1]) {
      workflowId = args[++i];
    } else if (arg.startsWith("--workflow=")) {
      workflowId = arg.slice("--workflow=".length);
    } else if (arg === "--stage" && args[i + 1]) {
      const parsed = Number(args[++i]);
      if (!Number.isInteger(parsed) || parsed < 0) {
        return { success: false, error: "Stage index must be a non-negative integer" };
      }
      stageIndex = parsed;
    } else if (arg.startsWith("--stage=")) {
      const parsed = Number(arg.slice("--stage=".length));
      if (!Number.isInteger(parsed) || parsed < 0) {
        return { success: false, error: "Stage index must be a non-negative integer" };
      }
      stageIndex = parsed;
    } else if (arg === "--message" && args[i + 1]) {
      message = args[++i];
    } else if (arg.startsWith("--message=")) {
      message = arg.slice("--message=".length);
    } else if (arg === "--role" && args[i + 1]) {
      const nextRole = args[++i];
      if (nextRole !== "impl" && nextRole !== "control") {
        return { success: false, error: "Role must be 'impl' or 'control'" };
      }
      role = nextRole;
    } else if (arg.startsWith("--role=")) {
      const nextRole = arg.slice("--role=".length);
      if (nextRole !== "impl" && nextRole !== "control") {
        return { success: false, error: "Role must be 'impl' or 'control'" };
      }
      role = nextRole;
    } else if (arg === "--provider" && args[i + 1]) {
      const nextProvider = args[++i] as ProviderName;
      if (!VALID_PROVIDERS.includes(nextProvider)) {
        return { success: false, error: "Provider must be anthropic, openai, gemini, or ollama" };
      }
      provider = nextProvider;
    } else if (arg.startsWith("--provider=")) {
      const nextProvider = arg.slice("--provider=".length) as ProviderName;
      if (!VALID_PROVIDERS.includes(nextProvider)) {
        return { success: false, error: "Provider must be anthropic, openai, gemini, or ollama" };
      }
      provider = nextProvider;
    } else if (arg === "--model" && args[i + 1]) {
      model = args[++i];
    } else if (arg.startsWith("--model=")) {
      model = arg.slice("--model=".length);
    } else if (arg === "--help" || arg === "-h") {
      return { success: false, error: "SHOW_HELP" };
    } else if (arg.startsWith("-")) {
      return { success: false, error: `Unknown option: ${arg}` };
    }
  }

  if (!workflowId) {
    return { success: false, error: "Missing required option: --workflow" };
  }

  return {
    success: true,
    options: {
      workflowId,
      stageIndex,
      message,
      role,
      provider,
      model,
    },
  };
}

function emitEvent(event: Record<string, unknown>): void {
  process.stdout.write(`${JSON.stringify(event)}\n`);
}

function formatHelp(): string {
  return `
Usage: choragen agent:run --workflow <id> [--stage <index>] [--message "<text>"] [--role <impl|control>] [--provider <name>] [--model <name>]

Runs an agent session for the specified workflow stage and streams structured events (message, tool_call, tool_result).
`.trim();
}

export async function runAgentRun(args: string[], workspaceRoot: string): Promise<void> {
  const parseResult = parseAgentRunArgs(args);

  if (!parseResult.success) {
    if (parseResult.error === "SHOW_HELP") {
      emitEvent({ type: "help", message: formatHelp() });
      return;
    }
    console.error(parseResult.error);
    process.exit(1);
  }

  const {
    workflowId,
    stageIndex: providedStageIndex,
    message,
    role,
    provider: providerOverride,
    model: modelOverride,
  } = parseResult.options;

  const manager = new WorkflowManager(workspaceRoot);
  const workflow = await manager.get(workflowId);
  if (!workflow) {
    console.error(`Workflow not found: ${workflowId}`);
    process.exit(1);
  }

  const effectiveStageIndex =
    typeof providedStageIndex === "number" ? providedStageIndex : workflow.currentStage ?? 0;
  const currentStage = workflow.stages[effectiveStageIndex];
  if (!currentStage) {
    console.error(`Invalid stage index ${effectiveStageIndex} for workflow ${workflowId}`);
    process.exit(1);
  }

  const providerName = providerOverride ?? getProviderFromEnv() ?? "anthropic";
  const apiKey = getApiKeyFromEnv(providerName);
  if (!apiKey) {
    const envVar =
      providerName === "anthropic"
        ? "ANTHROPIC_API_KEY"
        : providerName === "openai"
          ? "OPENAI_API_KEY"
          : providerName === "gemini"
            ? "GEMINI_API_KEY"
            : "OLLAMA_HOST";
    console.error(`Missing API key for provider '${providerName}'. Set ${envVar}.`);
    process.exit(1);
  }

  const model = modelOverride ?? process.env.CHORAGEN_MODEL ?? DEFAULT_MODELS[providerName];

  let provider;
  try {
    provider = createProvider(providerName, { apiKey, model });
  } catch (error) {
    if (error instanceof ProviderError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }

  const events: AgentSessionEvents = {
    onMessage: (event) => emitEvent({ type: "message", ...event }),
    onToolCall: (event) => emitEvent({ type: "tool_call", ...event }),
    onToolResult: (event) => emitEvent({ type: "tool_result", ...event }),
  };

  const originalLog = console.log;
  console.log = () => {
    // Suppress loop logging to keep stdout JSON-only for streaming clients.
  };

  try {
    const result = await runAgentSession(
      {
        role,
        provider,
        workflowId,
        stageIndex: effectiveStageIndex,
        workspaceRoot,
        inputMessage: message,
      },
      { events }
    );

    emitEvent({
      type: "done",
      exitCode: result.success ? 0 : 1,
      stopReason: result.stopReason,
      gatesSatisfied: result.success && result.stopReason === "end_turn",
    });

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    emitEvent({ type: "error", message: messageText });
    console.error(messageText);
    process.exit(1);
  } finally {
    console.log = originalLog;
  }
}
