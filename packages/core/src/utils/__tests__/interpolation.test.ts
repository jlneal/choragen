/**
 * @design-doc docs/design/core/features/task-management.md
 * @user-intent "Verify variable interpolation replaces placeholders correctly in task prompts"
 */

import { describe, expect, it } from "vitest";
import { interpolateTaskPrompt } from "../interpolation.js";

describe("interpolateTaskPrompt", () => {
  it("replaces all known variables from context", () => {
    const template =
      "Task {{taskId}}: {{taskTitle}} (chain {{chainId}}, request {{requestId}}) domain {{domain}}.\nObjective: {{objective}}";

    const result = interpolateTaskPrompt(template, {
      taskId: "T-001",
      taskTitle: "Implement feature",
      chainId: "CHAIN-123",
      requestId: "CR-999",
      domain: "core",
      objective: "Ship the thing",
    });

    expect(result).toBe(
      "Task T-001: Implement feature (chain CHAIN-123, request CR-999) domain core.\nObjective: Ship the thing"
    );
  });

  it("joins array values with newlines", () => {
    const template = "Criteria:\n{{acceptanceCriteria}}\nContext:\n{{context}}";

    const result = interpolateTaskPrompt(template, {
      acceptanceCriteria: ["one", "two"],
      context: ["first line", "second line"],
    });

    expect(result).toBe("Criteria:\none\ntwo\nContext:\nfirst line\nsecond line");
  });

  it("leaves unknown or missing variables untouched", () => {
    const template = "Unknown {{foo}} remains, missing {{objective}} too, known {{taskId}}.";

    const result = interpolateTaskPrompt(template, {
      taskId: "T-777",
    });

    expect(result).toBe("Unknown {{foo}} remains, missing {{objective}} too, known T-777.");
  });

  it("handles nested braces without stripping surrounding text", () => {
    const template = "Wrap { {{taskId}} } and keep {{{unknown}}}";

    const result = interpolateTaskPrompt(template, {
      taskId: "T-100",
    });

    expect(result).toBe("Wrap { T-100 } and keep {{{unknown}}}");
  });

  it("supports empty string values", () => {
    const template = "Objective: {{objective}}.";

    const result = interpolateTaskPrompt(template, {
      objective: "",
    });

    expect(result).toBe("Objective: .");
  });
});
