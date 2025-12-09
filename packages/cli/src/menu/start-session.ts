// ADR: ADR-010-agent-runtime-architecture

/**
 * Start Session Wizard for the interactive menu.
 *
 * This module provides the wizard flow for configuring and starting
 * a new agent session. It guides users through selecting role, provider,
 * model, limits, and task description.
 */

import * as p from "@clack/prompts";
import {
  promptRole,
  promptProvider,
  promptModel,
  promptTokenLimit,
  promptCostLimit,
  promptRequireApproval,
  promptTaskDescription,
  promptConfirmation,
  type SessionConfig,
} from "./prompts.js";
import type { MenuContext } from "./types.js";
import { runAgentStart } from "../commands/agent.js";
import { getApiKeyFromEnv } from "../runtime/index.js";
import { loadUserConfig } from "../config/index.js";

/**
 * Result from the start session wizard.
 */
export interface StartSessionResult {
  /** Whether the wizard was cancelled */
  cancelled: boolean;
  /** Whether a session was started */
  started: boolean;
  /** The session configuration if started */
  config?: SessionConfig;
}

/**
 * Run the start session wizard.
 *
 * This wizard guides the user through configuring a new agent session:
 * 1. Select role (impl/control)
 * 2. Select provider (anthropic/openai/gemini/ollama)
 * 3. Enter model name (with provider-specific default)
 * 4. Set token limit (optional)
 * 5. Set cost limit (optional)
 * 6. Toggle approval requirement
 * 7. Enter task description
 * 8. Confirm and start
 *
 * @param context - The menu context with workspace info
 * @returns Result indicating whether session was started or cancelled
 */
export async function runStartSessionWizard(
  context: MenuContext
): Promise<StartSessionResult> {
  p.log.step("Configure New Session");

  // Load saved defaults
  const { config: userConfig, warning } = await loadUserConfig(context.workspaceRoot);
  const defaults = userConfig.defaults;

  if (warning) {
    p.log.warn(warning);
  }

  // Step 1: Select role (pre-filled with saved default)
  const roleResult = await promptRole(defaults.role);
  if (roleResult.cancelled) {
    return { cancelled: true, started: false };
  }
  const role = roleResult.value!;

  // Step 2: Select provider (pre-filled with saved default)
  const providerResult = await promptProvider(defaults.provider);
  if (providerResult.cancelled) {
    return { cancelled: true, started: false };
  }
  const provider = providerResult.value!;

  // Check API key availability and warn if missing
  const hasApiKey = !!getApiKeyFromEnv(provider);
  if (!hasApiKey) {
    p.log.warn(`No API key found for ${provider}. Session may fail to start.`);
  }

  // Step 3: Enter model name (pre-filled with saved default if provider matches)
  const savedModel = provider === defaults.provider ? defaults.model : undefined;
  const modelResult = await promptModel(provider, savedModel);
  if (modelResult.cancelled) {
    return { cancelled: true, started: false };
  }
  const model = modelResult.value!;

  // Step 4: Set token limit (optional, pre-filled with saved default)
  const tokenLimitResult = await promptTokenLimit(defaults.tokenLimit);
  if (tokenLimitResult.cancelled) {
    return { cancelled: true, started: false };
  }
  const tokenLimit = tokenLimitResult.value;

  // Step 5: Set cost limit (optional, pre-filled with saved default)
  const costLimitResult = await promptCostLimit(defaults.costLimit);
  if (costLimitResult.cancelled) {
    return { cancelled: true, started: false };
  }
  const costLimit = costLimitResult.value;

  // Step 6: Toggle approval requirement (pre-filled with saved default)
  const approvalResult = await promptRequireApproval(defaults.requireApproval);
  if (approvalResult.cancelled) {
    return { cancelled: true, started: false };
  }
  const requireApproval = approvalResult.value!;

  // Step 7: Enter task description
  const taskResult = await promptTaskDescription();
  if (taskResult.cancelled) {
    return { cancelled: true, started: false };
  }
  const taskDescription = taskResult.value!;

  // Build configuration
  const config: SessionConfig = {
    role,
    provider,
    model,
    tokenLimit,
    costLimit,
    requireApproval,
    taskDescription,
  };

  // Step 8: Confirmation
  const confirmResult = await promptConfirmation(config);
  if (confirmResult.cancelled) {
    return { cancelled: true, started: false };
  }

  if (!confirmResult.value) {
    p.log.info("Session cancelled.");
    return { cancelled: false, started: false };
  }

  // Start the session
  await startSession(config, context.workspaceRoot);

  return { cancelled: false, started: true, config };
}

/**
 * Start an agent session with the given configuration.
 *
 * This function constructs the CLI arguments and calls runAgentStart.
 *
 * @param config - The session configuration
 * @param workspaceRoot - The workspace root directory
 */
export async function startSession(
  config: SessionConfig,
  workspaceRoot: string
): Promise<void> {
  // Build CLI arguments
  const args: string[] = [
    `--role=${config.role}`,
    `--provider=${config.provider}`,
    `--model=${config.model}`,
  ];

  if (config.tokenLimit !== undefined) {
    args.push(`--max-tokens=${config.tokenLimit}`);
  }

  if (config.costLimit !== undefined) {
    args.push(`--max-cost=${config.costLimit}`);
  }

  if (config.requireApproval) {
    args.push("--require-approval");
  }

  // Note: Task description is not directly passed to runAgentStart
  // as it's used for context in the session, not as a CLI flag.
  // The agent runtime will prompt for or receive the task separately.

  p.log.success("Starting session...");
  console.log("");

  // Call the existing runAgentStart function
  await runAgentStart(args, workspaceRoot);
}

/**
 * Check if a provider has an API key configured.
 *
 * @param provider - The provider name
 * @returns Whether an API key is available
 */
export function hasProviderApiKey(provider: string): boolean {
  return !!getApiKeyFromEnv(provider as "anthropic" | "openai" | "gemini" | "ollama");
}
