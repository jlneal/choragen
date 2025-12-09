/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify settings menu displays options and updates user config correctly"
 * @test-type unit
 */

import { describe, it, expect } from "vitest";
import { getSettingsOptions } from "../../menu/settings.js";
import type { UserConfigDefaults } from "../../config/types.js";

describe("Settings Menu", () => {
  describe("getSettingsOptions", () => {
    it("returns all settings options", () => {
      const defaults: UserConfigDefaults = {};
      const options = getSettingsOptions(defaults);

      const expectedIds = [
        "default-provider",
        "default-model",
        "default-role",
        "token-limit",
        "cost-limit",
        "approval-settings",
        "reset-defaults",
        "back",
      ];

      const actualIds = options.map((opt) => opt.id);
      expect(actualIds).toEqual(expectedIds);
    });

    it("shows current provider value as hint", () => {
      const defaults: UserConfigDefaults = {
        provider: "openai",
      };
      const options = getSettingsOptions(defaults);

      const providerOption = options.find((opt) => opt.id === "default-provider");
      expect(providerOption?.hint).toBe("openai");
    });

    it("shows current model value as hint", () => {
      const defaults: UserConfigDefaults = {
        model: "gpt-4o",
      };
      const options = getSettingsOptions(defaults);

      const modelOption = options.find((opt) => opt.id === "default-model");
      expect(modelOption?.hint).toBe("gpt-4o");
    });

    it("shows current role value as hint", () => {
      const defaults: UserConfigDefaults = {
        role: "control",
      };
      const options = getSettingsOptions(defaults);

      const roleOption = options.find((opt) => opt.id === "default-role");
      expect(roleOption?.hint).toBe("control");
    });

    it("shows formatted token limit as hint", () => {
      const defaults: UserConfigDefaults = {
        tokenLimit: 100000,
      };
      const options = getSettingsOptions(defaults);

      const tokenOption = options.find((opt) => opt.id === "token-limit");
      expect(tokenOption?.hint).toBe("100,000");
    });

    it("shows formatted cost limit as hint", () => {
      const defaults: UserConfigDefaults = {
        costLimit: 5.0,
      };
      const options = getSettingsOptions(defaults);

      const costOption = options.find((opt) => opt.id === "cost-limit");
      expect(costOption?.hint).toBe("$5.00");
    });

    it("shows approval setting as Yes/No hint", () => {
      const defaultsTrue: UserConfigDefaults = {
        requireApproval: true,
      };
      const optionsTrue = getSettingsOptions(defaultsTrue);
      const approvalOptionTrue = optionsTrue.find((opt) => opt.id === "approval-settings");
      expect(approvalOptionTrue?.hint).toBe("Yes");

      const defaultsFalse: UserConfigDefaults = {
        requireApproval: false,
      };
      const optionsFalse = getSettingsOptions(defaultsFalse);
      const approvalOptionFalse = optionsFalse.find((opt) => opt.id === "approval-settings");
      expect(approvalOptionFalse?.hint).toBe("No");
    });

    it("shows 'not set' for undefined values", () => {
      const defaults: UserConfigDefaults = {};
      const options = getSettingsOptions(defaults);

      const providerOption = options.find((opt) => opt.id === "default-provider");
      expect(providerOption?.hint).toBe("not set");

      const modelOption = options.find((opt) => opt.id === "default-model");
      expect(modelOption?.hint).toBe("not set");

      const tokenOption = options.find((opt) => opt.id === "token-limit");
      expect(tokenOption?.hint).toBe("not set");
    });

    it("has no hint for reset-defaults option", () => {
      const defaults: UserConfigDefaults = {};
      const options = getSettingsOptions(defaults);

      const resetOption = options.find((opt) => opt.id === "reset-defaults");
      expect(resetOption?.hint).toBeUndefined();
    });

    it("has no hint for back option", () => {
      const defaults: UserConfigDefaults = {};
      const options = getSettingsOptions(defaults);

      const backOption = options.find((opt) => opt.id === "back");
      expect(backOption?.hint).toBeUndefined();
    });

    it("has correct labels for all options", () => {
      const defaults: UserConfigDefaults = {};
      const options = getSettingsOptions(defaults);

      const expectedLabels: Record<string, string> = {
        "default-provider": "Default Provider",
        "default-model": "Default Model",
        "default-role": "Default Role",
        "token-limit": "Token Limit",
        "cost-limit": "Cost Limit",
        "approval-settings": "Require Approval",
        "reset-defaults": "Reset to Defaults",
        "back": "Back to Main Menu",
      };

      for (const option of options) {
        expect(option.label).toBe(expectedLabels[option.id]);
      }
    });
  });
});
