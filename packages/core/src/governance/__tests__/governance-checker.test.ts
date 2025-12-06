/**
 * @design-doc docs/design/core/features/governance-enforcement.md
 * @user-intent "Verify governance rules are correctly checked and enforced"
 */

import { describe, it, expect } from "vitest";
import {
  checkMutation,
  checkMutations,
  GovernanceChecker,
  formatCheckSummary,
} from "../governance-checker.js";
import type { GovernanceSchema } from "../types.js";

describe("governance-checker", () => {
  const testSchema: GovernanceSchema = {
    mutations: {
      allow: [
        { pattern: "components/**/*.tsx", actions: ["create", "modify"] },
        { pattern: "__tests__/**/*", actions: ["create", "modify", "delete"] },
      ],
      approve: [
        {
          pattern: "supabase/migrations/*.sql",
          actions: ["create", "modify"],
          reason: "Schema changes require review",
        },
      ],
      deny: [
        { pattern: "*.key", actions: ["create", "modify", "delete"] },
        { pattern: ".env*", actions: ["create", "modify", "delete"] },
      ],
    },
  };

  describe("checkMutation", () => {
    it("allows matching allow rules", () => {
      const result = checkMutation(
        testSchema,
        "components/Button/Button.tsx",
        "create"
      );
      expect(result.policy).toBe("allow");
    });

    it("requires approval for approve rules", () => {
      const result = checkMutation(
        testSchema,
        "supabase/migrations/001_init.sql",
        "create"
      );
      expect(result.policy).toBe("approve");
      expect(result.reason).toBe("Schema changes require review");
    });

    it("denies matching deny rules", () => {
      const result = checkMutation(testSchema, "secrets.key", "create");
      expect(result.policy).toBe("deny");
    });

    it("denies .env files", () => {
      const result = checkMutation(testSchema, ".env.local", "modify");
      expect(result.policy).toBe("deny");
    });

    it("deny rules take precedence over allow", () => {
      // Even if a pattern would match allow, deny wins
      const schema: GovernanceSchema = {
        mutations: {
          allow: [{ pattern: "**/*", actions: ["create", "modify", "delete"] }],
          approve: [],
          deny: [{ pattern: "*.secret", actions: ["create", "modify", "delete"] }],
        },
      };
      const result = checkMutation(schema, "config.secret", "create");
      expect(result.policy).toBe("deny");
    });

    it("denies unmatched files by default", () => {
      const result = checkMutation(testSchema, "random/unmatched/file.xyz", "create");
      expect(result.policy).toBe("deny");
      expect(result.reason).toBe("No matching governance rule");
    });
  });

  describe("checkMutations", () => {
    it("checks multiple files", () => {
      const summary = checkMutations(testSchema, [
        { file: "components/Button.tsx", action: "create" },
        { file: "supabase/migrations/001.sql", action: "create" },
        { file: "secrets.key", action: "create" },
      ]);

      expect(summary.allowed.length).toBe(1);
      expect(summary.needsApproval.length).toBe(1);
      expect(summary.denied.length).toBe(1);
      expect(summary.allAllowed).toBe(false);
      expect(summary.hasDenied).toBe(true);
      expect(summary.hasApprovalRequired).toBe(true);
    });

    it("reports all allowed when no issues", () => {
      const summary = checkMutations(testSchema, [
        { file: "components/Button.tsx", action: "create" },
        { file: "__tests__/Button.test.tsx", action: "create" },
      ]);

      expect(summary.allAllowed).toBe(true);
      expect(summary.hasDenied).toBe(false);
      expect(summary.hasApprovalRequired).toBe(false);
    });
  });

  describe("GovernanceChecker class", () => {
    it("provides convenience methods", () => {
      const checker = new GovernanceChecker(testSchema);

      expect(checker.canCreate("components/New.tsx").policy).toBe("allow");
      expect(checker.canModify("components/Old.tsx").policy).toBe("allow");
      expect(checker.canDelete("__tests__/old.test.ts").policy).toBe("allow");
      expect(checker.canCreate("secrets.key").policy).toBe("deny");
    });

    it("gets matching rules", () => {
      const checker = new GovernanceChecker(testSchema);
      const rules = checker.getMatchingRules("components/Button.tsx");

      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].pattern).toBe("components/**/*.tsx");
    });
  });

  describe("formatCheckSummary", () => {
    it("formats all-allowed summary", () => {
      const summary = checkMutations(testSchema, [
        { file: "components/Button.tsx", action: "create" },
      ]);
      const output = formatCheckSummary(summary);
      expect(output).toContain("All mutations allowed");
    });

    it("formats denied summary", () => {
      const summary = checkMutations(testSchema, [
        { file: "secrets.key", action: "create" },
      ]);
      const output = formatCheckSummary(summary);
      expect(output).toContain("Denied mutations");
      expect(output).toContain("secrets.key");
    });
  });
});
