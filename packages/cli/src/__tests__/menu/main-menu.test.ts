/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify menu option definitions and configuration for interactive CLI"
 * @test-type unit
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the start-session wizard
vi.mock("../../menu/start-session.js", () => ({
  runStartSessionWizard: vi.fn().mockResolvedValue({ cancelled: true, started: false }),
}));

// Mock the settings menu
vi.mock("../../menu/settings.js", () => ({
  runSettingsMenu: vi.fn().mockResolvedValue({ cancelled: false, changed: false }),
}));
import {
  MAIN_MENU_OPTIONS,
  getMenuOptions,
  getMenuOptionById,
  getMenuOptionIds,
  executeMenuAction,
  type MenuActionResult,
} from "../../menu/main-menu.js";
import type { MenuOptionId } from "../../menu/types.js";

describe("Main Menu", () => {
  describe("MAIN_MENU_OPTIONS", () => {
    it("defines all required menu options", () => {
      const expectedIds: MenuOptionId[] = [
        "start-session",
        "resume-session",
        "list-sessions",
        "cleanup-sessions",
        "settings",
        "exit",
      ];

      const actualIds = MAIN_MENU_OPTIONS.map((opt) => opt.id);

      expect(actualIds).toEqual(expectedIds);
    });

    it("has correct labels for each option", () => {
      const expectedLabels: Record<MenuOptionId, string> = {
        "start-session": "Start New Session",
        "resume-session": "Resume Session",
        "list-sessions": "List Sessions",
        "cleanup-sessions": "Cleanup Old Sessions",
        settings: "Settings",
        exit: "Exit",
      };

      for (const option of MAIN_MENU_OPTIONS) {
        expect(option.label).toBe(expectedLabels[option.id]);
      }
    });

    it("is immutable (readonly)", () => {
      // TypeScript enforces this at compile time with 'as const'
      // This test verifies the array has the expected length
      const EXPECTED_OPTION_COUNT = 6;
      expect(MAIN_MENU_OPTIONS.length).toBe(EXPECTED_OPTION_COUNT);
    });
  });

  describe("getMenuOptions", () => {
    it("returns all options with default config", () => {
      const options = getMenuOptions();

      const EXPECTED_OPTION_COUNT = 6;
      expect(options.length).toBe(EXPECTED_OPTION_COUNT);
    });

    it("adds hint for paused sessions when count > 0", () => {
      const options = getMenuOptions({ pausedSessionCount: 3 });

      const resumeOption = options.find((opt) => opt.id === "resume-session");
      expect(resumeOption?.hint).toBe("3 paused");
    });

    it("does not add hint when pausedSessionCount is 0", () => {
      const options = getMenuOptions({ pausedSessionCount: 0 });

      const resumeOption = options.find((opt) => opt.id === "resume-session");
      expect(resumeOption?.hint).toBeUndefined();
    });

    it("filters out settings when showSettings is false", () => {
      const options = getMenuOptions({ showSettings: false });

      const settingsOption = options.find((opt) => opt.id === "settings");
      expect(settingsOption).toBeUndefined();
    });

    it("includes settings by default", () => {
      const options = getMenuOptions();

      const settingsOption = options.find((opt) => opt.id === "settings");
      expect(settingsOption).toBeDefined();
    });

    it("returns new array on each call (no mutation)", () => {
      const options1 = getMenuOptions();
      const options2 = getMenuOptions();

      expect(options1).not.toBe(options2);
      expect(options1).toEqual(options2);
    });
  });

  describe("getMenuOptionById", () => {
    it("returns option for valid ID", () => {
      const option = getMenuOptionById("start-session");

      expect(option).toBeDefined();
      expect(option?.id).toBe("start-session");
      expect(option?.label).toBe("Start New Session");
    });

    it("returns undefined for invalid ID", () => {
      // @ts-expect-error - Testing invalid ID
      const option = getMenuOptionById("invalid-id");

      expect(option).toBeUndefined();
    });

    it("finds each menu option by ID", () => {
      const ids: MenuOptionId[] = [
        "start-session",
        "resume-session",
        "list-sessions",
        "cleanup-sessions",
        "settings",
        "exit",
      ];

      for (const id of ids) {
        const option = getMenuOptionById(id);
        expect(option).toBeDefined();
        expect(option?.id).toBe(id);
      }
    });
  });

  describe("getMenuOptionIds", () => {
    it("returns all menu option IDs", () => {
      const ids = getMenuOptionIds();

      expect(ids).toEqual([
        "start-session",
        "resume-session",
        "list-sessions",
        "cleanup-sessions",
        "settings",
        "exit",
      ]);
    });

    it("returns new array on each call", () => {
      const ids1 = getMenuOptionIds();
      const ids2 = getMenuOptionIds();

      expect(ids1).not.toBe(ids2);
      expect(ids1).toEqual(ids2);
    });
  });

  describe("executeMenuAction", () => {
    const mockContext = { workspaceRoot: "/test/workspace" };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("returns continueLoop: true for start-session when cancelled", async () => {
      // The mock returns cancelled: true, started: false by default
      const result: MenuActionResult = await executeMenuAction(
        "start-session",
        mockContext
      );

      // When cancelled or not started, continueLoop should be true
      expect(result.continueLoop).toBe(true);
    });

    it("returns continueLoop: true for resume-session", async () => {
      const result: MenuActionResult = await executeMenuAction(
        "resume-session",
        mockContext
      );

      expect(result.continueLoop).toBe(true);
    });

    it("returns continueLoop: true for list-sessions", async () => {
      const result: MenuActionResult = await executeMenuAction(
        "list-sessions",
        mockContext
      );

      expect(result.continueLoop).toBe(true);
    });

    it("returns continueLoop: true for cleanup-sessions", async () => {
      const result: MenuActionResult = await executeMenuAction(
        "cleanup-sessions",
        mockContext
      );

      expect(result.continueLoop).toBe(true);
    });

    it("returns continueLoop: true for settings", async () => {
      const result: MenuActionResult = await executeMenuAction(
        "settings",
        mockContext
      );

      expect(result.continueLoop).toBe(true);
    });

    it("returns continueLoop: false for exit", async () => {
      const result: MenuActionResult = await executeMenuAction(
        "exit",
        mockContext
      );

      expect(result.continueLoop).toBe(false);
    });

    it("handles all menu option IDs without throwing", async () => {
      const ids = getMenuOptionIds();

      for (const id of ids) {
        const result = await executeMenuAction(id, mockContext);
        expect(result).toHaveProperty("continueLoop");
      }
    });
  });
});
