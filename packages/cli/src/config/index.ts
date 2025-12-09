// ADR: ADR-010-agent-runtime-architecture

/**
 * Config module exports.
 *
 * This module provides user configuration persistence for the
 * Choragen CLI.
 */

// Types
export type {
  UserConfig,
  UserConfigDefaults,
  SettingsOptionId,
  SettingsOption,
} from "./types.js";

export {
  USER_CONFIG_VERSION,
  DEFAULT_USER_CONFIG,
} from "./types.js";

// User config persistence
export {
  USER_CONFIG_PATH,
  loadUserConfig,
  saveUserConfig,
  updateUserDefaults,
  resetUserConfig,
  parseUserConfigYaml,
  serializeUserConfigYaml,
  getUserConfigPath,
  type LoadConfigResult,
} from "./user-config.js";
