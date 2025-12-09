// ADR: ADR-010-agent-runtime-architecture

/**
 * Settings menu for the interactive agent interface.
 *
 * This module provides the settings submenu that allows users to
 * configure default values for session parameters. Settings are
 * persisted to `.choragen/user-settings.yaml`.
 */

import * as p from "@clack/prompts";
import type { MenuContext } from "./types.js";
import type { SettingsOptionId, SettingsOption, UserConfigDefaults } from "../config/types.js";
import {
  loadUserConfig,
  updateUserDefaults,
  resetUserConfig,
  DEFAULT_USER_CONFIG,
} from "../config/index.js";
import { DEFAULT_MODELS, type ProviderName, type AgentRole } from "../runtime/index.js";

/**
 * Result from the settings menu.
 */
export interface SettingsMenuResult {
  /** Whether the menu was cancelled */
  cancelled: boolean;
  /** Whether any settings were changed */
  changed: boolean;
}

/**
 * Get settings menu options with current values as hints.
 *
 * @param defaults - Current default values
 * @returns Array of settings options with hints
 */
export function getSettingsOptions(defaults: UserConfigDefaults): SettingsOption[] {
  return [
    {
      id: "default-provider",
      label: "Default Provider",
      hint: defaults.provider ?? "not set",
    },
    {
      id: "default-model",
      label: "Default Model",
      hint: defaults.model ?? "not set",
    },
    {
      id: "default-role",
      label: "Default Role",
      hint: defaults.role ?? "not set",
    },
    {
      id: "token-limit",
      label: "Token Limit",
      hint: defaults.tokenLimit?.toLocaleString() ?? "not set",
    },
    {
      id: "cost-limit",
      label: "Cost Limit",
      hint: defaults.costLimit !== undefined ? `$${defaults.costLimit.toFixed(2)}` : "not set",
    },
    {
      id: "approval-settings",
      label: "Require Approval",
      hint: defaults.requireApproval !== undefined
        ? (defaults.requireApproval ? "Yes" : "No")
        : "not set",
    },
    {
      id: "reset-defaults",
      label: "Reset to Defaults",
      hint: undefined,
    },
    {
      id: "back",
      label: "Back to Main Menu",
      hint: undefined,
    },
  ];
}

/**
 * Run the settings menu loop.
 *
 * @param context - The menu context with workspace info
 * @returns Result indicating whether settings were changed
 */
export async function runSettingsMenu(
  context: MenuContext
): Promise<SettingsMenuResult> {
  let changed = false;

  // Load current config
  const loadResult = await loadUserConfig(context.workspaceRoot);
  let currentDefaults = loadResult.config.defaults;

  // Show warning if config was reset
  if (loadResult.warning) {
    p.log.warn(loadResult.warning);
  }

  // Settings menu loop
  let continueLoop = true;
  while (continueLoop) {
    p.log.step("Settings");

    const options = getSettingsOptions(currentDefaults);

    const selected = await p.select({
      message: "Configure defaults",
      options: options.map((opt) => ({
        value: opt.id,
        label: opt.label,
        hint: opt.hint,
      })),
    });

    if (p.isCancel(selected)) {
      return { cancelled: true, changed };
    }

    const optionId = selected as SettingsOptionId;

    switch (optionId) {
      case "default-provider": {
        const result = await editProvider(currentDefaults.provider);
        if (!result.cancelled && result.value !== undefined) {
          currentDefaults = (await updateUserDefaults(context.workspaceRoot, {
            provider: result.value,
          })).defaults;
          changed = true;
          p.log.success(`Default provider set to: ${result.value}`);
        }
        break;
      }

      case "default-model": {
        const result = await editModel(currentDefaults.model, currentDefaults.provider);
        if (!result.cancelled && result.value !== undefined) {
          currentDefaults = (await updateUserDefaults(context.workspaceRoot, {
            model: result.value,
          })).defaults;
          changed = true;
          p.log.success(`Default model set to: ${result.value}`);
        }
        break;
      }

      case "default-role": {
        const result = await editRole(currentDefaults.role);
        if (!result.cancelled && result.value !== undefined) {
          currentDefaults = (await updateUserDefaults(context.workspaceRoot, {
            role: result.value,
          })).defaults;
          changed = true;
          p.log.success(`Default role set to: ${result.value}`);
        }
        break;
      }

      case "token-limit": {
        const result = await editTokenLimit(currentDefaults.tokenLimit);
        if (!result.cancelled) {
          currentDefaults = (await updateUserDefaults(context.workspaceRoot, {
            tokenLimit: result.value,
          })).defaults;
          changed = true;
          if (result.value !== undefined) {
            p.log.success(`Token limit set to: ${result.value.toLocaleString()}`);
          } else {
            p.log.success("Token limit cleared");
          }
        }
        break;
      }

      case "cost-limit": {
        const result = await editCostLimit(currentDefaults.costLimit);
        if (!result.cancelled) {
          currentDefaults = (await updateUserDefaults(context.workspaceRoot, {
            costLimit: result.value,
          })).defaults;
          changed = true;
          if (result.value !== undefined) {
            p.log.success(`Cost limit set to: $${result.value.toFixed(2)}`);
          } else {
            p.log.success("Cost limit cleared");
          }
        }
        break;
      }

      case "approval-settings": {
        const result = await editApprovalSetting(currentDefaults.requireApproval);
        if (!result.cancelled && result.value !== undefined) {
          currentDefaults = (await updateUserDefaults(context.workspaceRoot, {
            requireApproval: result.value,
          })).defaults;
          changed = true;
          p.log.success(`Require approval set to: ${result.value ? "Yes" : "No"}`);
        }
        break;
      }

      case "reset-defaults": {
        const confirm = await p.confirm({
          message: "Reset all settings to defaults?",
          initialValue: false,
        });

        if (!p.isCancel(confirm) && confirm) {
          await resetUserConfig(context.workspaceRoot);
          currentDefaults = DEFAULT_USER_CONFIG.defaults;
          changed = true;
          p.log.success("Settings reset to defaults");
        }
        break;
      }

      case "back":
        continueLoop = false;
        break;
    }

    // Add spacing between iterations
    if (continueLoop) {
      console.log("");
    }
  }

  return { cancelled: false, changed };
}

/**
 * Result from an edit operation.
 */
interface EditResult<T> {
  cancelled: boolean;
  value?: T;
}

/**
 * Edit the default provider.
 */
async function editProvider(
  current?: ProviderName
): Promise<EditResult<ProviderName>> {
  const providers: ProviderName[] = ["anthropic", "openai", "gemini", "ollama"];

  const result = await p.select({
    message: "Select default provider",
    options: providers.map((provider) => ({
      value: provider,
      label: provider,
      hint: provider === current ? "(current)" : undefined,
    })),
    initialValue: current,
  });

  if (p.isCancel(result)) {
    return { cancelled: true };
  }

  return { cancelled: false, value: result as ProviderName };
}

/**
 * Edit the default model.
 */
async function editModel(
  current?: string,
  provider?: ProviderName
): Promise<EditResult<string>> {
  const defaultModel = provider ? DEFAULT_MODELS[provider] : "claude-sonnet-4-20250514";

  const result = await p.text({
    message: "Enter default model name",
    placeholder: defaultModel,
    defaultValue: current ?? defaultModel,
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return "Model name is required";
      }
      return undefined;
    },
  });

  if (p.isCancel(result)) {
    return { cancelled: true };
  }

  return { cancelled: false, value: result as string };
}

/**
 * Edit the default role.
 */
async function editRole(current?: AgentRole): Promise<EditResult<AgentRole>> {
  const result = await p.select({
    message: "Select default role",
    options: [
      {
        value: "impl",
        label: "impl",
        hint: current === "impl" ? "(current)" : "Implementation agent",
      },
      {
        value: "control",
        label: "control",
        hint: current === "control" ? "(current)" : "Control/management agent",
      },
    ],
    initialValue: current,
  });

  if (p.isCancel(result)) {
    return { cancelled: true };
  }

  return { cancelled: false, value: result as AgentRole };
}

/**
 * Edit the token limit.
 */
async function editTokenLimit(
  current?: number
): Promise<EditResult<number | undefined>> {
  const result = await p.text({
    message: "Enter token limit (leave empty to clear)",
    placeholder: current?.toString() ?? "100000",
    defaultValue: current?.toString() ?? "",
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return undefined; // Empty is valid (clears the setting)
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
 * Edit the cost limit.
 */
async function editCostLimit(
  current?: number
): Promise<EditResult<number | undefined>> {
  const result = await p.text({
    message: "Enter cost limit in USD (leave empty to clear)",
    placeholder: current !== undefined ? `$${current.toFixed(2)}` : "$5.00",
    defaultValue: current !== undefined ? current.toFixed(2) : "",
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return undefined; // Empty is valid (clears the setting)
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
 * Edit the approval requirement setting.
 */
async function editApprovalSetting(
  current?: boolean
): Promise<EditResult<boolean>> {
  const result = await p.confirm({
    message: "Require approval for sensitive operations by default?",
    initialValue: current ?? false,
  });

  if (p.isCancel(result)) {
    return { cancelled: true };
  }

  return { cancelled: false, value: result as boolean };
}
