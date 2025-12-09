/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify start session wizard flow and configuration"
 * @test-type unit
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SessionConfig } from "../../menu/prompts.js";

// Mock @clack/prompts
vi.mock("@clack/prompts", () => ({
  select: vi.fn(),
  text: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn((value) => value === Symbol.for("cancel")),
  log: {
    step: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock runtime functions
vi.mock("../../runtime/index.js", () => ({
  DEFAULT_MODELS: {
    anthropic: "claude-sonnet-4-20250514",
    openai: "gpt-4o",
    gemini: "gemini-2.0-flash",
    ollama: "llama2",
  },
  getApiKeyFromEnv: vi.fn((provider: string) => {
    if (provider === "anthropic") return "test-key";
    if (provider === "openai") return "test-key";
    return null;
  }),
}));

// Mock runAgentStart
vi.mock("../../commands/agent.js", () => ({
  runAgentStart: vi.fn(),
}));

import * as p from "@clack/prompts";
import { runAgentStart } from "../../commands/agent.js";
import {
  wrapPromptResult,
  formatSessionConfig,
} from "../../menu/prompts.js";
import {
  runStartSessionWizard,
  startSession,
  hasProviderApiKey,
} from "../../menu/start-session.js";

describe("Start Session Wizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("wrapPromptResult", () => {
    it("returns cancelled: true for cancel symbol", () => {
      const result = wrapPromptResult(Symbol.for("cancel"));
      expect(result.cancelled).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it("returns cancelled: false with value for normal result", () => {
      const result = wrapPromptResult("test-value");
      expect(result.cancelled).toBe(false);
      expect(result.value).toBe("test-value");
    });

    it("handles boolean values", () => {
      const trueResult = wrapPromptResult(true);
      expect(trueResult.cancelled).toBe(false);
      expect(trueResult.value).toBe(true);

      const falseResult = wrapPromptResult(false);
      expect(falseResult.cancelled).toBe(false);
      expect(falseResult.value).toBe(false);
    });
  });

  describe("formatSessionConfig", () => {
    it("formats basic configuration", () => {
      const config: SessionConfig = {
        role: "impl",
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        requireApproval: false,
        taskDescription: "Test task",
      };

      const formatted = formatSessionConfig(config);

      expect(formatted).toContain("Role:      impl");
      expect(formatted).toContain("Provider:  anthropic");
      expect(formatted).toContain("Model:     claude-sonnet-4-20250514");
      expect(formatted).toContain("Approval:  Not required");
      expect(formatted).toContain("Task:      Test task");
    });

    it("includes token limit when set", () => {
      const config: SessionConfig = {
        role: "control",
        provider: "openai",
        model: "gpt-4o",
        tokenLimit: 50000,
        requireApproval: true,
        taskDescription: "Another task",
      };

      const formatted = formatSessionConfig(config);

      expect(formatted).toContain("Tokens:    50,000");
    });

    it("includes cost limit when set", () => {
      const config: SessionConfig = {
        role: "impl",
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        costLimit: 10.5,
        requireApproval: false,
        taskDescription: "Task with cost",
      };

      const formatted = formatSessionConfig(config);

      expect(formatted).toContain("Cost:      $10.50");
    });

    it("truncates long task descriptions", () => {
      const longDescription = "A".repeat(100);
      const config: SessionConfig = {
        role: "impl",
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        requireApproval: false,
        taskDescription: longDescription,
      };

      const formatted = formatSessionConfig(config);

      expect(formatted).toContain("A".repeat(50) + "...");
    });

    it("shows approval required when set", () => {
      const config: SessionConfig = {
        role: "impl",
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        requireApproval: true,
        taskDescription: "Task",
      };

      const formatted = formatSessionConfig(config);

      expect(formatted).toContain("Approval:  Required");
    });
  });

  describe("hasProviderApiKey", () => {
    it("returns true for provider with API key", () => {
      expect(hasProviderApiKey("anthropic")).toBe(true);
      expect(hasProviderApiKey("openai")).toBe(true);
    });

    it("returns false for provider without API key", () => {
      expect(hasProviderApiKey("gemini")).toBe(false);
      expect(hasProviderApiKey("ollama")).toBe(false);
    });
  });

  describe("startSession", () => {
    it("constructs correct CLI arguments for basic config", async () => {
      const config: SessionConfig = {
        role: "impl",
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        requireApproval: false,
        taskDescription: "Test task",
      };

      await startSession(config, "/test/workspace");

      expect(runAgentStart).toHaveBeenCalledWith(
        expect.arrayContaining([
          "--role=impl",
          "--provider=anthropic",
          "--model=claude-sonnet-4-20250514",
        ]),
        "/test/workspace"
      );
    });

    it("includes max-tokens when tokenLimit is set", async () => {
      const config: SessionConfig = {
        role: "control",
        provider: "openai",
        model: "gpt-4o",
        tokenLimit: 75000,
        requireApproval: false,
        taskDescription: "Test",
      };

      await startSession(config, "/test/workspace");

      expect(runAgentStart).toHaveBeenCalledWith(
        expect.arrayContaining(["--max-tokens=75000"]),
        "/test/workspace"
      );
    });

    it("includes max-cost when costLimit is set", async () => {
      const config: SessionConfig = {
        role: "impl",
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        costLimit: 2.5,
        requireApproval: false,
        taskDescription: "Test",
      };

      await startSession(config, "/test/workspace");

      expect(runAgentStart).toHaveBeenCalledWith(
        expect.arrayContaining(["--max-cost=2.5"]),
        "/test/workspace"
      );
    });

    it("includes require-approval flag when set", async () => {
      const config: SessionConfig = {
        role: "impl",
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        requireApproval: true,
        taskDescription: "Test",
      };

      await startSession(config, "/test/workspace");

      expect(runAgentStart).toHaveBeenCalledWith(
        expect.arrayContaining(["--require-approval"]),
        "/test/workspace"
      );
    });

    it("does not include require-approval when false", async () => {
      const config: SessionConfig = {
        role: "impl",
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        requireApproval: false,
        taskDescription: "Test",
      };

      await startSession(config, "/test/workspace");

      const callArgs = vi.mocked(runAgentStart).mock.calls[0][0];
      expect(callArgs).not.toContain("--require-approval");
    });
  });

  describe("runStartSessionWizard", () => {
    const mockContext = { workspaceRoot: "/test/workspace" };

    it("returns cancelled when role selection is cancelled", async () => {
      vi.mocked(p.select).mockResolvedValueOnce(Symbol.for("cancel"));

      const result = await runStartSessionWizard(mockContext);

      expect(result.cancelled).toBe(true);
      expect(result.started).toBe(false);
    });

    it("returns cancelled when provider selection is cancelled", async () => {
      vi.mocked(p.select)
        .mockResolvedValueOnce("impl") // role
        .mockResolvedValueOnce(Symbol.for("cancel")); // provider

      const result = await runStartSessionWizard(mockContext);

      expect(result.cancelled).toBe(true);
      expect(result.started).toBe(false);
    });

    it("returns cancelled when model input is cancelled", async () => {
      vi.mocked(p.select)
        .mockResolvedValueOnce("impl") // role
        .mockResolvedValueOnce("anthropic"); // provider
      vi.mocked(p.text).mockResolvedValueOnce(Symbol.for("cancel")); // model

      const result = await runStartSessionWizard(mockContext);

      expect(result.cancelled).toBe(true);
      expect(result.started).toBe(false);
    });

    it("returns cancelled when token limit input is cancelled", async () => {
      vi.mocked(p.select)
        .mockResolvedValueOnce("impl") // role
        .mockResolvedValueOnce("anthropic"); // provider
      vi.mocked(p.text)
        .mockResolvedValueOnce("claude-sonnet-4-20250514") // model
        .mockResolvedValueOnce(Symbol.for("cancel")); // token limit

      const result = await runStartSessionWizard(mockContext);

      expect(result.cancelled).toBe(true);
      expect(result.started).toBe(false);
    });

    it("returns cancelled when cost limit input is cancelled", async () => {
      vi.mocked(p.select)
        .mockResolvedValueOnce("impl") // role
        .mockResolvedValueOnce("anthropic"); // provider
      vi.mocked(p.text)
        .mockResolvedValueOnce("claude-sonnet-4-20250514") // model
        .mockResolvedValueOnce("") // token limit (empty = skip)
        .mockResolvedValueOnce(Symbol.for("cancel")); // cost limit

      const result = await runStartSessionWizard(mockContext);

      expect(result.cancelled).toBe(true);
      expect(result.started).toBe(false);
    });

    it("returns cancelled when approval toggle is cancelled", async () => {
      vi.mocked(p.select)
        .mockResolvedValueOnce("impl") // role
        .mockResolvedValueOnce("anthropic"); // provider
      vi.mocked(p.text)
        .mockResolvedValueOnce("claude-sonnet-4-20250514") // model
        .mockResolvedValueOnce("") // token limit
        .mockResolvedValueOnce(""); // cost limit
      vi.mocked(p.confirm).mockResolvedValueOnce(Symbol.for("cancel")); // approval

      const result = await runStartSessionWizard(mockContext);

      expect(result.cancelled).toBe(true);
      expect(result.started).toBe(false);
    });

    it("returns cancelled when task description is cancelled", async () => {
      vi.mocked(p.select)
        .mockResolvedValueOnce("impl") // role
        .mockResolvedValueOnce("anthropic"); // provider
      vi.mocked(p.text)
        .mockResolvedValueOnce("claude-sonnet-4-20250514") // model
        .mockResolvedValueOnce("") // token limit
        .mockResolvedValueOnce("") // cost limit
        .mockResolvedValueOnce(Symbol.for("cancel")); // task description
      vi.mocked(p.confirm).mockResolvedValueOnce(false); // approval

      const result = await runStartSessionWizard(mockContext);

      expect(result.cancelled).toBe(true);
      expect(result.started).toBe(false);
    });

    it("returns cancelled when confirmation is cancelled", async () => {
      vi.mocked(p.select)
        .mockResolvedValueOnce("impl") // role
        .mockResolvedValueOnce("anthropic"); // provider
      vi.mocked(p.text)
        .mockResolvedValueOnce("claude-sonnet-4-20250514") // model
        .mockResolvedValueOnce("") // token limit
        .mockResolvedValueOnce("") // cost limit
        .mockResolvedValueOnce("Test task"); // task description
      vi.mocked(p.confirm)
        .mockResolvedValueOnce(false) // approval
        .mockResolvedValueOnce(Symbol.for("cancel")); // confirmation

      const result = await runStartSessionWizard(mockContext);

      expect(result.cancelled).toBe(true);
      expect(result.started).toBe(false);
    });

    it("returns not started when user declines confirmation", async () => {
      vi.mocked(p.select)
        .mockResolvedValueOnce("impl") // role
        .mockResolvedValueOnce("anthropic"); // provider
      vi.mocked(p.text)
        .mockResolvedValueOnce("claude-sonnet-4-20250514") // model
        .mockResolvedValueOnce("") // token limit
        .mockResolvedValueOnce("") // cost limit
        .mockResolvedValueOnce("Test task"); // task description
      vi.mocked(p.confirm)
        .mockResolvedValueOnce(false) // approval
        .mockResolvedValueOnce(false); // confirmation declined

      const result = await runStartSessionWizard(mockContext);

      expect(result.cancelled).toBe(false);
      expect(result.started).toBe(false);
      expect(runAgentStart).not.toHaveBeenCalled();
    });

    it("starts session when all steps complete and confirmed", async () => {
      vi.mocked(p.select)
        .mockResolvedValueOnce("impl") // role
        .mockResolvedValueOnce("anthropic"); // provider
      vi.mocked(p.text)
        .mockResolvedValueOnce("claude-sonnet-4-20250514") // model
        .mockResolvedValueOnce("100000") // token limit
        .mockResolvedValueOnce("5.00") // cost limit
        .mockResolvedValueOnce("Implement the feature"); // task description
      vi.mocked(p.confirm)
        .mockResolvedValueOnce(true) // approval
        .mockResolvedValueOnce(true); // confirmation

      const result = await runStartSessionWizard(mockContext);

      expect(result.cancelled).toBe(false);
      expect(result.started).toBe(true);
      expect(result.config).toEqual({
        role: "impl",
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        tokenLimit: 100000,
        costLimit: 5.0,
        requireApproval: true,
        taskDescription: "Implement the feature",
      });
      expect(runAgentStart).toHaveBeenCalled();
    });

    it("warns when provider has no API key", async () => {
      vi.mocked(p.select)
        .mockResolvedValueOnce("impl") // role
        .mockResolvedValueOnce("gemini"); // provider without key
      vi.mocked(p.text).mockResolvedValueOnce(Symbol.for("cancel")); // cancel at model

      await runStartSessionWizard(mockContext);

      expect(p.log.warn).toHaveBeenCalledWith(
        expect.stringContaining("No API key found for gemini")
      );
    });

    it("handles empty optional fields correctly", async () => {
      vi.mocked(p.select)
        .mockResolvedValueOnce("control") // role
        .mockResolvedValueOnce("openai"); // provider
      vi.mocked(p.text)
        .mockResolvedValueOnce("gpt-4o") // model
        .mockResolvedValueOnce("") // empty token limit
        .mockResolvedValueOnce("") // empty cost limit
        .mockResolvedValueOnce("Simple task"); // task description
      vi.mocked(p.confirm)
        .mockResolvedValueOnce(false) // no approval
        .mockResolvedValueOnce(true); // confirm

      const result = await runStartSessionWizard(mockContext);

      expect(result.started).toBe(true);
      expect(result.config?.tokenLimit).toBeUndefined();
      expect(result.config?.costLimit).toBeUndefined();
    });
  });
});
