/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify user config persistence loads, saves, and parses settings correctly"
 * @test-type unit
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
  loadUserConfig,
  saveUserConfig,
  updateUserDefaults,
  resetUserConfig,
  parseUserConfigYaml,
  serializeUserConfigYaml,
  getUserConfigPath,
  USER_CONFIG_PATH,
} from "../../config/user-config.js";
import {
  DEFAULT_USER_CONFIG,
  USER_CONFIG_VERSION,
  type UserConfig,
} from "../../config/types.js";

// Mock fs module
vi.mock("node:fs/promises");

const mockedFs = vi.mocked(fs);

describe("User Config", () => {
  const workspaceRoot = "/test/workspace";
  const configPath = path.join(workspaceRoot, USER_CONFIG_PATH);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getUserConfigPath", () => {
    it("returns correct path for workspace root", () => {
      const result = getUserConfigPath("/my/workspace");
      expect(result).toBe("/my/workspace/.choragen/user-settings.yaml");
    });
  });

  describe("loadUserConfig", () => {
    it("returns defaults when config file does not exist", async () => {
      const error = new Error("ENOENT") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      mockedFs.readFile.mockRejectedValue(error);

      const result = await loadUserConfig(workspaceRoot);

      expect(result.config).toEqual(DEFAULT_USER_CONFIG);
      expect(result.fromFile).toBe(false);
      expect(result.warning).toBeUndefined();
    });

    it("loads config from file when it exists", async () => {
      const yamlContent = `version: 1
defaults:
  provider: openai
  model: gpt-4o
  tokenLimit: 50000
  costLimit: 2.50
  requireApproval: true
  role: control
`;
      mockedFs.readFile.mockResolvedValue(yamlContent);

      const result = await loadUserConfig(workspaceRoot);

      expect(result.fromFile).toBe(true);
      expect(result.config.version).toBe(USER_CONFIG_VERSION);
      expect(result.config.defaults.provider).toBe("openai");
      expect(result.config.defaults.model).toBe("gpt-4o");
      expect(result.config.defaults.tokenLimit).toBe(50000);
      expect(result.config.defaults.costLimit).toBe(2.5);
      expect(result.config.defaults.requireApproval).toBe(true);
      expect(result.config.defaults.role).toBe("control");
    });

    it("returns defaults with warning for version mismatch", async () => {
      const yamlContent = `version: 999
defaults:
  provider: openai
`;
      mockedFs.readFile.mockResolvedValue(yamlContent);

      const result = await loadUserConfig(workspaceRoot);

      expect(result.config).toEqual(DEFAULT_USER_CONFIG);
      expect(result.fromFile).toBe(false);
      expect(result.warning).toContain("version mismatch");
    });

    it("returns defaults with warning for parse errors", async () => {
      mockedFs.readFile.mockRejectedValue(new Error("Parse error"));

      const result = await loadUserConfig(workspaceRoot);

      expect(result.config).toEqual(DEFAULT_USER_CONFIG);
      expect(result.fromFile).toBe(false);
      expect(result.warning).toContain("Failed to parse");
    });

    it("merges partial config with defaults", async () => {
      const yamlContent = `version: 1
defaults:
  provider: gemini
`;
      mockedFs.readFile.mockResolvedValue(yamlContent);

      const result = await loadUserConfig(workspaceRoot);

      expect(result.config.defaults.provider).toBe("gemini");
      // Other fields should come from defaults
      expect(result.config.defaults.tokenLimit).toBe(DEFAULT_USER_CONFIG.defaults.tokenLimit);
      expect(result.config.defaults.costLimit).toBe(DEFAULT_USER_CONFIG.defaults.costLimit);
    });
  });

  describe("saveUserConfig", () => {
    it("creates directory and writes config file", async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const config: UserConfig = {
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

      await saveUserConfig(workspaceRoot, config);

      expect(mockedFs.mkdir).toHaveBeenCalledWith(
        path.dirname(configPath),
        { recursive: true }
      );
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        configPath,
        expect.stringContaining("version: 1"),
        "utf-8"
      );
    });
  });

  describe("updateUserDefaults", () => {
    it("updates specific defaults and saves", async () => {
      // First load returns existing config
      const existingYaml = `version: 1
defaults:
  provider: anthropic
  model: claude-sonnet-4-20250514
`;
      mockedFs.readFile.mockResolvedValue(existingYaml);
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await updateUserDefaults(workspaceRoot, {
        provider: "openai",
        tokenLimit: 75000,
      });

      expect(result.defaults.provider).toBe("openai");
      expect(result.defaults.tokenLimit).toBe(75000);
      expect(result.defaults.model).toBe("claude-sonnet-4-20250514"); // Preserved
      expect(mockedFs.writeFile).toHaveBeenCalled();
    });
  });

  describe("resetUserConfig", () => {
    it("saves default config and returns it", async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await resetUserConfig(workspaceRoot);

      expect(result).toEqual(DEFAULT_USER_CONFIG);
      expect(mockedFs.writeFile).toHaveBeenCalled();
    });
  });

  describe("parseUserConfigYaml", () => {
    it("parses complete config", () => {
      const yaml = `version: 1
defaults:
  provider: anthropic
  model: claude-sonnet-4-20250514
  role: impl
  tokenLimit: 100000
  costLimit: 5.00
  requireApproval: false
`;
      const result = parseUserConfigYaml(yaml);

      expect(result.version).toBe(1);
      expect(result.defaults.provider).toBe("anthropic");
      expect(result.defaults.model).toBe("claude-sonnet-4-20250514");
      expect(result.defaults.role).toBe("impl");
      expect(result.defaults.tokenLimit).toBe(100000);
      expect(result.defaults.costLimit).toBe(5.0);
      expect(result.defaults.requireApproval).toBe(false);
    });

    it("handles quoted strings", () => {
      const yaml = `version: 1
defaults:
  model: "gpt-4o-mini"
`;
      const result = parseUserConfigYaml(yaml);
      expect(result.defaults.model).toBe("gpt-4o-mini");
    });

    it("ignores comments", () => {
      const yaml = `# This is a comment
version: 1
# Another comment
defaults:
  provider: openai
`;
      const result = parseUserConfigYaml(yaml);
      expect(result.version).toBe(1);
      expect(result.defaults.provider).toBe("openai");
    });

    it("handles empty file", () => {
      const yaml = "";
      const result = parseUserConfigYaml(yaml);
      expect(result.version).toBe(USER_CONFIG_VERSION);
      expect(result.defaults).toEqual({});
    });

    it("validates role values", () => {
      const yaml = `version: 1
defaults:
  role: invalid
`;
      const result = parseUserConfigYaml(yaml);
      expect(result.defaults.role).toBeUndefined();
    });

    it("validates numeric values", () => {
      const yaml = `version: 1
defaults:
  tokenLimit: -100
  costLimit: abc
`;
      const result = parseUserConfigYaml(yaml);
      expect(result.defaults.tokenLimit).toBeUndefined();
      expect(result.defaults.costLimit).toBeUndefined();
    });
  });

  describe("serializeUserConfigYaml", () => {
    it("serializes complete config", () => {
      const config: UserConfig = {
        version: 1,
        defaults: {
          provider: "anthropic",
          model: "claude-sonnet-4-20250514",
          role: "impl",
          tokenLimit: 100000,
          costLimit: 5.0,
          requireApproval: false,
        },
      };

      const yaml = serializeUserConfigYaml(config);

      expect(yaml).toContain("version: 1");
      expect(yaml).toContain("provider: anthropic");
      expect(yaml).toContain("model: claude-sonnet-4-20250514");
      expect(yaml).toContain("role: impl");
      expect(yaml).toContain("tokenLimit: 100000");
      expect(yaml).toContain("costLimit: 5.00");
      expect(yaml).toContain("requireApproval: false");
    });

    it("omits undefined values", () => {
      const config: UserConfig = {
        version: 1,
        defaults: {
          provider: "anthropic",
        },
      };

      const yaml = serializeUserConfigYaml(config);

      expect(yaml).toContain("provider: anthropic");
      expect(yaml).not.toContain("tokenLimit:");
      expect(yaml).not.toContain("costLimit:");
    });

    it("includes header comments", () => {
      const config: UserConfig = {
        version: 1,
        defaults: {},
      };

      const yaml = serializeUserConfigYaml(config);

      expect(yaml).toContain("# Choragen User Settings");
      expect(yaml).toContain("Do not store sensitive data");
    });

    it("round-trips correctly", () => {
      const original: UserConfig = {
        version: 1,
        defaults: {
          provider: "openai",
          model: "gpt-4o",
          role: "control",
          tokenLimit: 50000,
          costLimit: 2.5,
          requireApproval: true,
        },
      };

      const yaml = serializeUserConfigYaml(original);
      const parsed = parseUserConfigYaml(yaml);

      expect(parsed.version).toBe(original.version);
      expect(parsed.defaults.provider).toBe(original.defaults.provider);
      expect(parsed.defaults.model).toBe(original.defaults.model);
      expect(parsed.defaults.role).toBe(original.defaults.role);
      expect(parsed.defaults.tokenLimit).toBe(original.defaults.tokenLimit);
      expect(parsed.defaults.costLimit).toBe(original.defaults.costLimit);
      expect(parsed.defaults.requireApproval).toBe(original.defaults.requireApproval);
    });
  });
});
