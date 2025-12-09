/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Integration tests for interactive menu system - full flows and edge cases"
 * @test-type integration
 *
 * These tests verify the integration between menu components without
 * testing the infinite loop functions directly (those are covered by unit tests).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SessionSummary, SessionStatus } from "../../runtime/index.js";
import type { MenuContext, MenuOptionId } from "../../menu/types.js";
import type { UserConfig } from "../../config/types.js";

// ============================================================================
// Mocks - Must be defined before imports that use them
// ============================================================================

vi.mock("@clack/prompts", () => ({
  select: vi.fn(),
  text: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn((value) => value === Symbol.for("cancel")),
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  log: {
    step: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../runtime/index.js", () => ({
  Session: {
    listAll: vi.fn(),
    load: vi.fn(),
  },
  DEFAULT_MODELS: {
    anthropic: "claude-sonnet-4-20250514",
    openai: "gpt-4o",
    gemini: "gemini-2.0-flash",
    ollama: "llama2",
  },
  getApiKeyFromEnv: vi.fn(),
}));

vi.mock("../../commands/agent.js", () => ({
  runAgentStart: vi.fn(),
}));

vi.mock("../../config/index.js", () => ({
  loadUserConfig: vi.fn(),
  updateUserDefaults: vi.fn(),
  resetUserConfig: vi.fn(),
  DEFAULT_USER_CONFIG: {
    version: 1,
    defaults: {},
  },
}));

vi.mock("node:fs/promises", () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

// ============================================================================
// Imports
// ============================================================================

import * as p from "@clack/prompts";
import { Session, getApiKeyFromEnv } from "../../runtime/index.js";
import { runAgentStart } from "../../commands/agent.js";
import { loadUserConfig, updateUserDefaults, resetUserConfig } from "../../config/index.js";
import {
  executeMenuAction,
  showMainMenu,
  getMenuOptions,
  MAIN_MENU_OPTIONS,
} from "../../menu/index.js";

// ============================================================================
// Test Fixtures
// ============================================================================

interface MockSessionData {
  id: string;
  role: string;
  model: string;
  status: SessionStatus;
  startTime: string;
  endTime: string | null;
  tokenUsage: { input: number; output: number; total: number };
  chainId: string | null;
  taskId: string | null;
  lastTurnIndex: number;
  messages: unknown[];
  error?: { message: string; recoverable: boolean };
}

function createMockSession(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: "session-20251208-143022-abc123",
    role: "impl",
    status: "paused",
    startTime: "2025-12-08T14:30:22.000Z",
    endTime: null,
    tokenUsage: { input: 5000, output: 7000, total: 12000 },
    chainId: null,
    taskId: null,
    ...overrides,
  };
}

function createMockLoadedSession(overrides: Partial<MockSessionData> = {}): MockSessionData {
  return {
    id: "session-20251208-143022-abc123",
    role: "impl",
    model: "claude-sonnet-4-20250514",
    status: "paused",
    startTime: "2025-12-08T14:30:22.000Z",
    endTime: null,
    tokenUsage: { input: 5000, output: 7000, total: 12000 },
    chainId: null,
    taskId: null,
    lastTurnIndex: 5,
    messages: [],
    ...overrides,
  };
}

function mockSessionLoad(data: MockSessionData | null): void {
  vi.mocked(Session.load).mockResolvedValue(
    data as unknown as Awaited<ReturnType<typeof Session.load>>
  );
}

const mockContext: MenuContext = {
  workspaceRoot: "/test/workspace",
};

const defaultUserConfig: UserConfig = {
  version: 1,
  defaults: {},
};

// ============================================================================
// Integration Tests
// ============================================================================

describe("Menu Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Session.listAll).mockResolvedValue([]);
    vi.mocked(loadUserConfig).mockResolvedValue({
      config: defaultUserConfig,
      fromFile: false,
    });
    vi.mocked(getApiKeyFromEnv).mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Menu Structure Tests
  // ==========================================================================
  describe("Menu Structure", () => {
    it("has all required menu options", () => {
      const optionIds = MAIN_MENU_OPTIONS.map((opt) => opt.id);

      expect(optionIds).toContain("start-session");
      expect(optionIds).toContain("resume-session");
      expect(optionIds).toContain("list-sessions");
      expect(optionIds).toContain("cleanup-sessions");
      expect(optionIds).toContain("settings");
      expect(optionIds).toContain("exit");
    });

    it("shows paused session count in resume option hint", () => {
      const PAUSED_COUNT = 3;
      const options = getMenuOptions({ pausedSessionCount: PAUSED_COUNT });
      const resumeOption = options.find((opt) => opt.id === "resume-session");

      expect(resumeOption?.hint).toBe("3 paused");
    });

    it("shows no hint when no paused sessions", () => {
      const options = getMenuOptions({ pausedSessionCount: 0 });
      const resumeOption = options.find((opt) => opt.id === "resume-session");

      expect(resumeOption?.hint).toBeUndefined();
    });
  });

  // ==========================================================================
  // Main Menu Display Tests
  // ==========================================================================
  describe("Main Menu Display", () => {
    it("displays intro banner and menu options", async () => {
      vi.mocked(p.select).mockResolvedValueOnce("exit");

      await showMainMenu();

      expect(p.intro).toHaveBeenCalledWith("🤖 Choragen Agent Runtime");
      expect(p.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "What would you like to do?",
        })
      );
    });

    it("returns selected option", async () => {
      vi.mocked(p.select).mockResolvedValueOnce("settings");

      const result = await showMainMenu();

      expect(result.selected).toBe("settings");
      expect(result.cancelled).toBe(false);
    });

    it("handles Ctrl+C cancellation", async () => {
      vi.mocked(p.select).mockResolvedValueOnce(Symbol.for("cancel"));

      const result = await showMainMenu();

      expect(result.cancelled).toBe(true);
      expect(result.selected).toBeNull();
      expect(p.cancel).toHaveBeenCalledWith("Goodbye!");
    });
  });

  // ==========================================================================
  // Menu Action Dispatch Tests
  // ==========================================================================
  describe("Menu Action Dispatch", () => {
    it("exit action stops the menu loop", async () => {
      const result = await executeMenuAction("exit", mockContext);

      expect(result.continueLoop).toBe(false);
      expect(p.outro).toHaveBeenCalledWith("Goodbye!");
    });

    it("cleanup action shows instructions and continues loop", async () => {
      const result = await executeMenuAction("cleanup-sessions", mockContext);

      expect(p.log.info).toHaveBeenCalledWith(
        expect.stringContaining("choragen agent:cleanup")
      );
      expect(result.continueLoop).toBe(true);
    });

    it("unknown action continues loop", async () => {
      const result = await executeMenuAction(
        "unknown-action" as MenuOptionId,
        mockContext
      );

      expect(result.continueLoop).toBe(true);
    });
  });

  // ==========================================================================
  // Settings Integration Tests
  // ==========================================================================
  describe("Settings Integration", () => {
    it("settings action loads user config", async () => {
      vi.mocked(p.select).mockResolvedValueOnce("back");

      await executeMenuAction("settings", mockContext);

      expect(loadUserConfig).toHaveBeenCalledWith(mockContext.workspaceRoot);
    });

    it("settings changes are persisted", async () => {
      vi.mocked(p.select)
        .mockResolvedValueOnce("default-provider")
        .mockResolvedValueOnce("openai")
        .mockResolvedValueOnce("back");

      vi.mocked(updateUserDefaults).mockResolvedValue({
        version: 1,
        defaults: { provider: "openai" },
      });

      await executeMenuAction("settings", mockContext);

      expect(updateUserDefaults).toHaveBeenCalledWith(
        mockContext.workspaceRoot,
        { provider: "openai" }
      );
    });

    it("settings reset clears all defaults", async () => {
      vi.mocked(p.select)
        .mockResolvedValueOnce("reset-defaults")
        .mockResolvedValueOnce("back");

      vi.mocked(p.confirm).mockResolvedValueOnce(true);
      vi.mocked(resetUserConfig).mockResolvedValue({
        version: 1,
        defaults: {},
      });

      await executeMenuAction("settings", mockContext);

      expect(resetUserConfig).toHaveBeenCalledWith(mockContext.workspaceRoot);
      expect(p.log.success).toHaveBeenCalledWith("Settings reset to defaults");
    });
  });

  // ==========================================================================
  // Session Browser Integration Tests
  // ==========================================================================
  describe("Session Browser Integration", () => {
    it("list-sessions action loads all sessions", async () => {
      vi.mocked(p.select).mockResolvedValueOnce("back");

      await executeMenuAction("list-sessions", mockContext);

      expect(Session.listAll).toHaveBeenCalledWith(mockContext.workspaceRoot);
    });

    it("resume-session action filters to resumable sessions", async () => {
      vi.mocked(Session.listAll).mockResolvedValue([
        createMockSession({ id: "s1", status: "running" }),
        createMockSession({ id: "s2", status: "paused" }),
        createMockSession({ id: "s3", status: "completed" }),
        createMockSession({ id: "s4", status: "failed" }),
      ]);

      vi.mocked(p.select).mockResolvedValueOnce("back");

      await executeMenuAction("resume-session", mockContext);

      // Verify select was called with filtered options
      const selectCall = vi.mocked(p.select).mock.calls[0][0] as {
        options: Array<{ value: unknown }>;
      };
      const optionValues = selectCall.options.map((o) => o.value);

      // Should include paused and failed (resumable)
      expect(optionValues).toContain("s2");
      expect(optionValues).toContain("s4");

      // Should NOT include running or completed
      expect(optionValues).not.toContain("s1");
      expect(optionValues).not.toContain("s3");
    });

    it("shows message when no sessions exist", async () => {
      vi.mocked(Session.listAll).mockResolvedValue([]);

      await executeMenuAction("list-sessions", mockContext);

      expect(p.log.info).toHaveBeenCalledWith("No sessions found.");
    });

    it("shows message when no resumable sessions exist", async () => {
      vi.mocked(Session.listAll).mockResolvedValue([]);

      await executeMenuAction("resume-session", mockContext);

      expect(p.log.info).toHaveBeenCalledWith("No resumable sessions found.");
    });
  });

  // ==========================================================================
  // Start Session Integration Tests
  // ==========================================================================
  describe("Start Session Integration", () => {
    it("start-session action loads user defaults", async () => {
      vi.mocked(p.select).mockResolvedValueOnce(Symbol.for("cancel"));

      await executeMenuAction("start-session", mockContext);

      expect(loadUserConfig).toHaveBeenCalledWith(mockContext.workspaceRoot);
    });

    it("warns when API key is missing for provider", async () => {
      vi.mocked(getApiKeyFromEnv).mockReturnValue(undefined);

      vi.mocked(p.select)
        .mockResolvedValueOnce("impl")
        .mockResolvedValueOnce("anthropic");

      vi.mocked(p.text).mockResolvedValueOnce(Symbol.for("cancel"));

      await executeMenuAction("start-session", mockContext);

      expect(p.log.warn).toHaveBeenCalledWith(
        expect.stringContaining("No API key found for anthropic")
      );
    });

    it("does not warn when API key is present", async () => {
      vi.mocked(getApiKeyFromEnv).mockReturnValue("test-api-key");

      vi.mocked(p.select)
        .mockResolvedValueOnce("impl")
        .mockResolvedValueOnce("anthropic");

      vi.mocked(p.text).mockResolvedValueOnce(Symbol.for("cancel"));

      await executeMenuAction("start-session", mockContext);

      expect(p.log.warn).not.toHaveBeenCalledWith(
        expect.stringContaining("No API key found")
      );
    });

    it("calls runAgentStart with correct arguments on confirmation", async () => {
      vi.mocked(getApiKeyFromEnv).mockReturnValue("test-api-key");

      vi.mocked(p.select)
        .mockResolvedValueOnce("impl")
        .mockResolvedValueOnce("anthropic");

      vi.mocked(p.text)
        .mockResolvedValueOnce("claude-sonnet-4-20250514")
        .mockResolvedValueOnce("100000")
        .mockResolvedValueOnce("5.00")
        .mockResolvedValueOnce("Implement the feature");

      vi.mocked(p.confirm)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      await executeMenuAction("start-session", mockContext);

      expect(runAgentStart).toHaveBeenCalledWith(
        expect.arrayContaining([
          "--role=impl",
          "--provider=anthropic",
          "--model=claude-sonnet-4-20250514",
        ]),
        mockContext.workspaceRoot
      );
    });

    it("does not start session when user declines confirmation", async () => {
      vi.mocked(getApiKeyFromEnv).mockReturnValue("test-api-key");

      vi.mocked(p.select)
        .mockResolvedValueOnce("impl")
        .mockResolvedValueOnce("anthropic");

      vi.mocked(p.text)
        .mockResolvedValueOnce("claude-sonnet-4-20250514")
        .mockResolvedValueOnce("")
        .mockResolvedValueOnce("")
        .mockResolvedValueOnce("Test task");

      vi.mocked(p.confirm)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);

      await executeMenuAction("start-session", mockContext);

      expect(runAgentStart).not.toHaveBeenCalled();
      expect(p.log.info).toHaveBeenCalledWith("Session cancelled.");
    });
  });

  // ==========================================================================
  // Keyboard Interrupt Handling Tests
  // ==========================================================================
  describe("Keyboard Interrupt Handling", () => {
    it("handles Ctrl+C during start session wizard", async () => {
      vi.mocked(p.select).mockResolvedValueOnce(Symbol.for("cancel"));

      const result = await executeMenuAction("start-session", mockContext);

      expect(result.continueLoop).toBe(true);
    });

    it("handles Ctrl+C during settings menu", async () => {
      vi.mocked(p.select).mockResolvedValueOnce(Symbol.for("cancel"));

      const result = await executeMenuAction("settings", mockContext);

      expect(result.continueLoop).toBe(false);
    });

    it("handles Ctrl+C during session browser", async () => {
      vi.mocked(Session.listAll).mockResolvedValue([
        createMockSession({ id: "s1", status: "paused" }),
      ]);

      vi.mocked(p.select).mockResolvedValueOnce(Symbol.for("cancel"));

      const result = await executeMenuAction("resume-session", mockContext);

      expect(result.continueLoop).toBe(true);
    });
  });

  // ==========================================================================
  // Config Warning Tests
  // ==========================================================================
  describe("Config Warning Handling", () => {
    it("displays config warning when present", async () => {
      vi.mocked(loadUserConfig).mockResolvedValue({
        config: defaultUserConfig,
        fromFile: false,
        warning: "Config file was corrupted, using defaults",
      });

      vi.mocked(p.select).mockResolvedValueOnce("back");

      await executeMenuAction("settings", mockContext);

      expect(p.log.warn).toHaveBeenCalledWith(
        "Config file was corrupted, using defaults"
      );
    });
  });

  // ==========================================================================
  // Session Resume Integration Tests
  // ==========================================================================
  describe("Session Resume Integration", () => {
    it("loads session details when selected", async () => {
      vi.mocked(Session.listAll).mockResolvedValue([
        createMockSession({ id: "s1", status: "paused" }),
      ]);

      mockSessionLoad(createMockLoadedSession({ id: "s1", status: "paused" }));

      vi.mocked(p.select)
        .mockResolvedValueOnce("s1")
        .mockResolvedValueOnce("resume");

      await executeMenuAction("resume-session", mockContext);

      expect(Session.load).toHaveBeenCalledWith("s1", mockContext.workspaceRoot);
    });

    it("exits loop when session is resumed", async () => {
      vi.mocked(Session.listAll).mockResolvedValue([
        createMockSession({ id: "s1", status: "paused" }),
      ]);

      mockSessionLoad(createMockLoadedSession({ id: "s1", status: "paused" }));

      vi.mocked(p.select)
        .mockResolvedValueOnce("s1")
        .mockResolvedValueOnce("resume");

      const result = await executeMenuAction("resume-session", mockContext);

      expect(result.continueLoop).toBe(false);
    });

    it("shows error when session not found", async () => {
      vi.mocked(Session.listAll).mockResolvedValue([
        createMockSession({ id: "s1", status: "paused" }),
      ]);

      mockSessionLoad(null);

      vi.mocked(p.select)
        .mockResolvedValueOnce("s1")
        .mockResolvedValueOnce("back")
        .mockResolvedValueOnce("back");

      await executeMenuAction("resume-session", mockContext);

      expect(p.log.error).toHaveBeenCalledWith(
        expect.stringContaining("Session not found")
      );
    });
  });
});
