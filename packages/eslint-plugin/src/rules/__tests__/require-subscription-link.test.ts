/**
 * Tests for require-subscription-link rule
 *
 * @design-doc docs/design/core/features/eslint-plugin.md
 * @user-intent "Warn when tRPC subscriptions are used without confirming subscription link configuration"
 * @test-type unit
 *
 * ADR: ADR-002-governance-schema
 * CR: CR-20251214-005
 */

import { describe, it, expect } from "vitest";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";
import rule from "../require-subscription-link.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: tsParser,
  },
});

describe("require-subscription-link", () => {
  it("should be a valid ESLint rule", () => {
    expect(rule).toBeDefined();
    expect(rule.meta).toBeDefined();
    expect(rule.create).toBeInstanceOf(Function);
  });

  ruleTester.run("require-subscription-link", rule, {
    valid: [
      {
        code: `trpc.workflow.onMessage.useQuery(input);`,
      },
      {
        code: `client.subscribeToEvent();`,
        // Suppressed with comment
        // @subscription-link-verified
      },
      {
        code: `// @subscription-link-verified
trpc.workflow.onMessage.useSubscription(input);`,
      },
      {
        code: `// @subscription-link-verified
client.subscribe("topic");`,
      },
    ],
    invalid: [
      {
        code: `trpc.workflow.onMessage.useSubscription(input);`,
        errors: [{ messageId: "verifySubscriptionLink", data: { method: "useSubscription" } }],
      },
      {
        code: `client.subscribe("topic");`,
        errors: [{ messageId: "verifySubscriptionLink", data: { method: "subscribe" } }],
      },
      {
        code: `trpc?.workflow?.onMessage.useSubscription(input);`,
        errors: [{ messageId: "verifySubscriptionLink", data: { method: "useSubscription" } }],
      },
    ],
  });
});
