// ADR: ADR-010-agent-runtime-architecture

/**
 * Reusable prompt helpers for the interactive menu.
 *
 * This module provides helper functions for common prompt patterns
 * used throughout the wizard flows.
 */

import * as p from "@clack/prompts";
import type { AgentRole, ProviderName } from "../runtime/index.js";
import { DEFAULT_MODELS, getApiKeyFromEnv } from "../runtime/index.js";

/**
 * Result from a wizard step that can be cancelled.
 */
export interface WizardStepResult<T> {
  /** Whether the step was cancelled */
  cancelled: boolean;
  /** The value if not cancelled */
  value?: T;
}

/**
 * Wrap a clack prompt result to handle cancellation.
 *
 * @param result - The result from a clack prompt
 * @returns Wrapped result with cancelled flag
 */
export function wrapPromptResult<T>(
  result: T | symbol
): WizardStepResult<T> {
  if (p.isCancel(result)) {
    return { cancelled: true };
  }
  return { cancelled: false, value: result as T };
}

/**
 * Prompt for agent role selection.
 *
 * @param defaultRole - Optional default role to pre-select
 * @returns Selected role or cancellation
 */
export async function promptRole(
  defaultRole?: AgentRole
): Promise<WizardStepResult<AgentRole>> {
  const result = await p.select({
    message: "Select role",
    options: [
      { value: "impl", label: "impl", hint: "Implementation agent" },
      { value: "control", label: "control", hint: "Control/management agent" },
    ],
    initialValue: defaultRole,
  });

  return wrapPromptResult(result as AgentRole);
}

/**
 * Prompt for provider selection with API key availability hints.
 *
 * @param defaultProvider - Optional default provider to pre-select
 * @returns Selected provider or cancellation
 */
export async function promptProvider(
  defaultProvider?: ProviderName
): Promise<WizardStepResult<ProviderName>> {
  const providers: ProviderName[] = ["anthropic", "openai", "gemini", "ollama"];

  const options = providers.map((provider) => {
    const hasKey = !!getApiKeyFromEnv(provider);
    const keyStatus = hasKey ? "✓ API key set" : "⚠ No API key";

    return {
      value: provider,
      label: provider,
      hint: keyStatus,
    };
  });

  const result = await p.select({
    message: "Select provider",
    options,
    initialValue: defaultProvider,
  });

  return wrapPromptResult(result as ProviderName);
}

/**
 * Prompt for model name with provider-specific default.
 *
 * @param provider - The selected provider
 * @param savedModel - Optional saved model name to use as default
 * @returns Model name or cancellation
 */
export async function promptModel(
  provider: ProviderName,
  savedModel?: string
): Promise<WizardStepResult<string>> {
  // Use saved model if available, otherwise use provider default
  const defaultModel = savedModel ?? DEFAULT_MODELS[provider];

  const result = await p.text({
    message: "Model name",
    placeholder: defaultModel,
    defaultValue: defaultModel,
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return "Model name is required";
      }
      return undefined;
    },
  });

  return wrapPromptResult(result as string);
}

/**
 * Prompt for optional token limit.
 *
 * @param defaultValue - Default token limit to show
 * @returns Token limit or undefined, or cancellation
 */
export async function promptTokenLimit(
  defaultValue = 100000
): Promise<WizardStepResult<number | undefined>> {
  const result = await p.text({
    message: "Token limit (optional)",
    placeholder: String(defaultValue),
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return undefined; // Empty is valid (optional)
      }
      const num = parseInt(value, 10);
      if (isNaN(num) || num <= 0) {
        return "Must be a positive integer";
      }
      return undefined;
    },
  });

  if (p.isCancel(result)) {
    return { cancelled: true };
  }

  const strValue = result as string;
  if (!strValue || strValue.trim().length === 0) {
    return { cancelled: false, value: undefined };
  }

  return { cancelled: false, value: parseInt(strValue, 10) };
}

/**
 * Prompt for optional cost limit.
 *
 * @param defaultValue - Default cost limit to show
 * @returns Cost limit or undefined, or cancellation
 */
export async function promptCostLimit(
  defaultValue = 5.0
): Promise<WizardStepResult<number | undefined>> {
  const result = await p.text({
    message: "Cost limit in USD (optional)",
    placeholder: `$${defaultValue.toFixed(2)}`,
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return undefined; // Empty is valid (optional)
      }
      // Strip leading $ if present
      const cleanValue = value.replace(/^\$/, "");
      const num = parseFloat(cleanValue);
      if (isNaN(num) || num <= 0) {
        return "Must be a positive number";
      }
      return undefined;
    },
  });

  if (p.isCancel(result)) {
    return { cancelled: true };
  }

  const strValue = result as string;
  if (!strValue || strValue.trim().length === 0) {
    return { cancelled: false, value: undefined };
  }

  // Strip leading $ if present
  const cleanValue = strValue.replace(/^\$/, "");
  return { cancelled: false, value: parseFloat(cleanValue) };
}

/**
 * Prompt for approval toggle.
 *
 * @param defaultValue - Optional default value for the toggle
 * @returns Whether approval is required, or cancellation
 */
export async function promptRequireApproval(
  defaultValue = false
): Promise<WizardStepResult<boolean>> {
  const result = await p.confirm({
    message: "Require approval for sensitive operations?",
    initialValue: defaultValue,
  });

  return wrapPromptResult(result as boolean);
}

/**
 * Prompt for task description (multi-line).
 *
 * @returns Task description or cancellation
 */
export async function promptTaskDescription(): Promise<WizardStepResult<string>> {
  const result = await p.text({
    message: "Task description",
    placeholder: "Describe what you want the agent to do...",
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return "Task description is required";
      }
      return undefined;
    },
  });

  return wrapPromptResult(result as string);
}

/**
 * Session configuration collected from the wizard.
 */
export interface SessionConfig {
  role: AgentRole;
  provider: ProviderName;
  model: string;
  tokenLimit?: number;
  costLimit?: number;
  requireApproval: boolean;
  taskDescription: string;
}

/**
 * Format session configuration for display in confirmation.
 *
 * @param config - The session configuration
 * @returns Formatted string for display
 */
export function formatSessionConfig(config: SessionConfig): string {
  const lines: string[] = [
    `  Role:      ${config.role}`,
    `  Provider:  ${config.provider}`,
    `  Model:     ${config.model}`,
  ];

  if (config.tokenLimit !== undefined) {
    lines.push(`  Tokens:    ${config.tokenLimit.toLocaleString()}`);
  }

  if (config.costLimit !== undefined) {
    lines.push(`  Cost:      $${config.costLimit.toFixed(2)}`);
  }

  lines.push(`  Approval:  ${config.requireApproval ? "Required" : "Not required"}`);
  lines.push(`  Task:      ${config.taskDescription.slice(0, 50)}${config.taskDescription.length > 50 ? "..." : ""}`);

  return lines.join("\n");
}

/**
 * Prompt for confirmation with session summary.
 *
 * @param config - The session configuration to confirm
 * @returns Whether confirmed, or cancellation
 */
export async function promptConfirmation(
  config: SessionConfig
): Promise<WizardStepResult<boolean>> {
  p.log.info("Session Configuration:");
  console.log(formatSessionConfig(config));
  console.log("");

  const result = await p.confirm({
    message: "Start session with these settings?",
    initialValue: true,
  });

  return wrapPromptResult(result as boolean);
}
