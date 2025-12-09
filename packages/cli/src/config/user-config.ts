// ADR: ADR-010-agent-runtime-architecture

/**
 * User configuration persistence for the Choragen CLI.
 *
 * This module handles loading and saving user settings to
 * `.choragen/config.yaml`. It includes schema versioning for
 * future migrations and graceful error handling.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { UserConfig, UserConfigDefaults } from "./types.js";
import { DEFAULT_USER_CONFIG, USER_CONFIG_VERSION } from "./types.js";

/**
 * Path to the user config file relative to workspace root.
 */
export const USER_CONFIG_PATH = ".choragen/user-settings.yaml";

/**
 * Result from loading user config.
 */
export interface LoadConfigResult {
  /** The loaded configuration */
  config: UserConfig;
  /** Whether the config was loaded from file (vs defaults) */
  fromFile: boolean;
  /** Warning message if config was reset due to errors */
  warning?: string;
}

/**
 * Load user configuration from the workspace.
 *
 * If the config file doesn't exist, returns defaults.
 * If the config file is invalid, returns defaults with a warning.
 *
 * @param workspaceRoot - The workspace root directory
 * @returns The loaded configuration with metadata
 */
export async function loadUserConfig(
  workspaceRoot: string
): Promise<LoadConfigResult> {
  const configPath = path.join(workspaceRoot, USER_CONFIG_PATH);

  try {
    const content = await fs.readFile(configPath, "utf-8");
    const parsed = parseUserConfigYaml(content);

    // Validate version
    if (parsed.version !== USER_CONFIG_VERSION) {
      // Future: implement migration logic here
      return {
        config: DEFAULT_USER_CONFIG,
        fromFile: false,
        warning: `Config version mismatch (found ${parsed.version}, expected ${USER_CONFIG_VERSION}). Using defaults.`,
      };
    }

    // Merge with defaults to ensure all fields are present
    const config = mergeWithDefaults(parsed);

    return { config, fromFile: true };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // File doesn't exist, use defaults
      return { config: DEFAULT_USER_CONFIG, fromFile: false };
    }

    // Parse error or other issue
    return {
      config: DEFAULT_USER_CONFIG,
      fromFile: false,
      warning: `Failed to parse config file: ${(error as Error).message}. Using defaults.`,
    };
  }
}

/**
 * Save user configuration to the workspace.
 *
 * Creates the `.choragen` directory if it doesn't exist.
 *
 * @param workspaceRoot - The workspace root directory
 * @param config - The configuration to save
 */
export async function saveUserConfig(
  workspaceRoot: string,
  config: UserConfig
): Promise<void> {
  const configPath = path.join(workspaceRoot, USER_CONFIG_PATH);
  const configDir = path.dirname(configPath);

  // Ensure directory exists
  await fs.mkdir(configDir, { recursive: true });

  // Serialize and write
  const content = serializeUserConfigYaml(config);
  await fs.writeFile(configPath, content, "utf-8");
}

/**
 * Update specific defaults in the user configuration.
 *
 * @param workspaceRoot - The workspace root directory
 * @param updates - Partial defaults to update
 * @returns The updated configuration
 */
export async function updateUserDefaults(
  workspaceRoot: string,
  updates: Partial<UserConfigDefaults>
): Promise<UserConfig> {
  const { config } = await loadUserConfig(workspaceRoot);

  const updated: UserConfig = {
    ...config,
    defaults: {
      ...config.defaults,
      ...updates,
    },
  };

  await saveUserConfig(workspaceRoot, updated);
  return updated;
}

/**
 * Reset user configuration to defaults.
 *
 * @param workspaceRoot - The workspace root directory
 * @returns The default configuration
 */
export async function resetUserConfig(
  workspaceRoot: string
): Promise<UserConfig> {
  await saveUserConfig(workspaceRoot, DEFAULT_USER_CONFIG);
  return DEFAULT_USER_CONFIG;
}

/**
 * Merge parsed config with defaults to ensure all fields are present.
 */
function mergeWithDefaults(parsed: UserConfig): UserConfig {
  return {
    version: parsed.version,
    defaults: {
      ...DEFAULT_USER_CONFIG.defaults,
      ...parsed.defaults,
    },
  };
}

/**
 * Parse user config YAML content.
 *
 * Uses a simple YAML parser similar to governance-parser.ts.
 */
export function parseUserConfigYaml(content: string): UserConfig {
  const lines = content.split("\n");
  const result: UserConfig = {
    version: USER_CONFIG_VERSION,
    defaults: {},
  };

  let inDefaults = false;

  for (const rawLine of lines) {
    // Skip comments and empty lines
    if (rawLine.trim().startsWith("#") || rawLine.trim() === "") continue;

    const line = rawLine;
    const indent = line.search(/\S/);
    const trimmed = line.trim();

    // Top-level key (no indent)
    if (indent === 0 && trimmed.includes(":")) {
      const colonIdx = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();

      if (key === "version" && value) {
        result.version = parseInt(value, 10);
      } else if (key === "defaults") {
        inDefaults = true;
      } else {
        inDefaults = false;
      }
      continue;
    }

    // Defaults section (2 spaces)
    if (indent === 2 && inDefaults && trimmed.includes(":")) {
      const colonIdx = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIdx).trim();
      let value: string = trimmed.slice(colonIdx + 1).trim();

      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      switch (key) {
        case "provider":
          if (value) {
            result.defaults.provider = value as UserConfigDefaults["provider"];
          }
          break;
        case "model":
          if (value) {
            result.defaults.model = value;
          }
          break;
        case "role":
          if (value === "impl" || value === "control") {
            result.defaults.role = value;
          }
          break;
        case "tokenLimit":
          if (value) {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num > 0) {
              result.defaults.tokenLimit = num;
            }
          }
          break;
        case "costLimit":
          if (value) {
            const num = parseFloat(value);
            if (!isNaN(num) && num > 0) {
              result.defaults.costLimit = num;
            }
          }
          break;
        case "requireApproval":
          result.defaults.requireApproval = value === "true";
          break;
      }
    }
  }

  return result;
}

/**
 * Serialize user config to YAML format.
 */
export function serializeUserConfigYaml(config: UserConfig): string {
  const lines: string[] = [];

  lines.push("# Choragen User Settings");
  lines.push("# This file stores your default session preferences.");
  lines.push("# Do not store sensitive data (API keys) here.");
  lines.push("");
  lines.push(`version: ${config.version}`);
  lines.push("");
  lines.push("defaults:");

  const { defaults } = config;

  if (defaults.provider !== undefined) {
    lines.push(`  provider: ${defaults.provider}`);
  }
  if (defaults.model !== undefined) {
    lines.push(`  model: ${defaults.model}`);
  }
  if (defaults.role !== undefined) {
    lines.push(`  role: ${defaults.role}`);
  }
  if (defaults.tokenLimit !== undefined) {
    lines.push(`  tokenLimit: ${defaults.tokenLimit}`);
  }
  if (defaults.costLimit !== undefined) {
    lines.push(`  costLimit: ${defaults.costLimit.toFixed(2)}`);
  }
  if (defaults.requireApproval !== undefined) {
    lines.push(`  requireApproval: ${defaults.requireApproval}`);
  }

  lines.push("");
  return lines.join("\n");
}

/**
 * Get the full path to the user config file.
 *
 * @param workspaceRoot - The workspace root directory
 * @returns The full path to the config file
 */
export function getUserConfigPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, USER_CONFIG_PATH);
}
