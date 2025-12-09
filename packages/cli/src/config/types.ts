// ADR: ADR-010-agent-runtime-architecture

/**
 * User configuration types for the Choragen CLI.
 *
 * These types define the structure of user settings that persist
 * across sessions in `.choragen/config.yaml`.
 */

import type { AgentRole, ProviderName } from "../runtime/index.js";

/**
 * Current schema version for user config.
 * Increment when making breaking changes to the config structure.
 */
export const USER_CONFIG_VERSION = 1;

/**
 * User configuration stored in `.choragen/config.yaml`.
 */
export interface UserConfig {
  /** Schema version for future migrations */
  version: number;

  /** Default values for session configuration */
  defaults: UserConfigDefaults;
}

/**
 * Default values for session configuration.
 */
export interface UserConfigDefaults {
  /** Default LLM provider */
  provider?: ProviderName;

  /** Default model name */
  model?: string;

  /** Default token limit */
  tokenLimit?: number;

  /** Default cost limit in USD */
  costLimit?: number;

  /** Default approval requirement setting */
  requireApproval?: boolean;

  /** Default agent role */
  role?: AgentRole;
}

/**
 * Settings menu option identifiers.
 */
export type SettingsOptionId =
  | "default-provider"
  | "default-model"
  | "default-role"
  | "token-limit"
  | "cost-limit"
  | "approval-settings"
  | "reset-defaults"
  | "back";

/**
 * A single settings menu option.
 */
export interface SettingsOption {
  /** Unique identifier for the option */
  id: SettingsOptionId;
  /** Display label shown to the user */
  label: string;
  /** Current value hint */
  hint?: string;
}

/**
 * Default configuration values.
 */
export const DEFAULT_USER_CONFIG: UserConfig = {
  version: USER_CONFIG_VERSION,
  defaults: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    tokenLimit: 100000,
    costLimit: 5.0,
    requireApproval: false,
    role: "impl",
  },
};
