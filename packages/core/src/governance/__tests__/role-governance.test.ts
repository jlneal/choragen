/**
 * @design-doc docs/design/core/features/governance-enforcement.md
 * @user-intent "Verify role-based governance rules correctly allow/deny file mutations per agent role"
 * @test-type unit
 */

import { describe, it, expect } from "vitest";
import { checkMutationForRole } from "../governance-checker.js";
import { parseGovernanceYaml } from "../governance-parser.js";
import type { GovernanceSchema, AgentRole } from "../types.js";

describe("role-governance", () => {
  describe("checkMutationForRole", () => {
    const schemaWithRoles: GovernanceSchema = {
      mutations: {
        allow: [{ pattern: "**/*", actions: ["create", "modify", "delete"] }],
        approve: [],
        deny: [],
      },
      roles: {
        impl: {
          allow: [
            { pattern: "packages/**/src/**/*.ts", actions: ["create", "modify"] },
            { pattern: "packages/**/__tests__/**/*.ts", actions: ["create", "modify", "delete"] },
          ],
          deny: [
            { pattern: "docs/tasks/**/*", actions: ["create", "modify", "delete"], reason: "impl cannot modify task files" },
            { pattern: "docs/requests/**/*", actions: ["create", "modify", "delete"] },
          ],
        },
        control: {
          allow: [
            { pattern: "docs/**/*.md", actions: ["create", "modify", "delete"] },
            { pattern: "AGENTS.md", actions: ["modify"] },
          ],
          deny: [
            { pattern: "packages/**/src/**/*.ts", actions: ["create", "modify"], reason: "control cannot write source code" },
          ],
        },
      },
    };

    describe("impl role", () => {
      const role: AgentRole = "impl";

      it("allows impl to create source files", () => {
        const result = checkMutationForRole(
          "packages/core/src/governance/types.ts",
          "create",
          role,
          schemaWithRoles
        );
        expect(result.policy).toBe("allow");
      });

      it("allows impl to modify source files", () => {
        const result = checkMutationForRole(
          "packages/core/src/governance/types.ts",
          "modify",
          role,
          schemaWithRoles
        );
        expect(result.policy).toBe("allow");
      });

      it("allows impl to create test files", () => {
        const result = checkMutationForRole(
          "packages/core/src/governance/__tests__/new-test.test.ts",
          "create",
          role,
          schemaWithRoles
        );
        expect(result.policy).toBe("allow");
      });

      it("allows impl to delete test files", () => {
        const result = checkMutationForRole(
          "packages/core/src/governance/__tests__/old-test.test.ts",
          "delete",
          role,
          schemaWithRoles
        );
        expect(result.policy).toBe("allow");
      });

      it("denies impl from modifying task files", () => {
        const result = checkMutationForRole(
          "docs/tasks/todo/some-task.md",
          "modify",
          role,
          schemaWithRoles
        );
        expect(result.policy).toBe("deny");
        expect(result.reason).toBe("impl cannot modify task files");
      });

      it("denies impl from creating request files", () => {
        const result = checkMutationForRole(
          "docs/requests/change-requests/todo/CR-001.md",
          "create",
          role,
          schemaWithRoles
        );
        expect(result.policy).toBe("deny");
      });

      it("denies impl from deleting source files (not in allow list)", () => {
        const result = checkMutationForRole(
          "packages/core/src/governance/types.ts",
          "delete",
          role,
          schemaWithRoles
        );
        expect(result.policy).toBe("deny");
        expect(result.reason).toContain("No matching role governance rule");
      });
    });

    describe("control role", () => {
      const role: AgentRole = "control";

      it("allows control to create documentation", () => {
        const result = checkMutationForRole(
          "docs/design/core/features/new-feature.md",
          "create",
          role,
          schemaWithRoles
        );
        expect(result.policy).toBe("allow");
      });

      it("allows control to modify AGENTS.md", () => {
        const result = checkMutationForRole(
          "AGENTS.md",
          "modify",
          role,
          schemaWithRoles
        );
        expect(result.policy).toBe("allow");
      });

      it("denies control from creating source files", () => {
        const result = checkMutationForRole(
          "packages/core/src/new-file.ts",
          "create",
          role,
          schemaWithRoles
        );
        expect(result.policy).toBe("deny");
        expect(result.reason).toBe("control cannot write source code");
      });

      it("denies control from modifying source files", () => {
        const result = checkMutationForRole(
          "packages/core/src/governance/types.ts",
          "modify",
          role,
          schemaWithRoles
        );
        expect(result.policy).toBe("deny");
      });
    });

    describe("fallback behavior", () => {
      const schemaWithoutRoles: GovernanceSchema = {
        mutations: {
          allow: [{ pattern: "src/**/*.ts", actions: ["create", "modify"] }],
          approve: [],
          deny: [{ pattern: "*.secret", actions: ["create", "modify", "delete"] }],
        },
      };

      it("falls back to global mutations when no roles section", () => {
        const result = checkMutationForRole(
          "src/index.ts",
          "create",
          "impl",
          schemaWithoutRoles
        );
        expect(result.policy).toBe("allow");
      });

      it("respects global deny rules when no roles section", () => {
        const result = checkMutationForRole(
          "config.secret",
          "create",
          "impl",
          schemaWithoutRoles
        );
        expect(result.policy).toBe("deny");
      });
    });

    describe("partial role definitions", () => {
      const schemaWithOnlyImpl: GovernanceSchema = {
        mutations: {
          allow: [{ pattern: "**/*", actions: ["create", "modify", "delete"] }],
          approve: [],
          deny: [],
        },
        roles: {
          impl: {
            allow: [{ pattern: "src/**/*.ts", actions: ["create", "modify"] }],
            deny: [],
          },
        },
      };

      it("denies when role has no rules defined", () => {
        const result = checkMutationForRole(
          "docs/readme.md",
          "create",
          "control",
          schemaWithOnlyImpl
        );
        expect(result.policy).toBe("deny");
        expect(result.reason).toContain("No governance rules defined for role");
      });
    });

    describe("deny takes precedence over allow", () => {
      const schemaWithOverlap: GovernanceSchema = {
        mutations: {
          allow: [],
          approve: [],
          deny: [],
        },
        roles: {
          impl: {
            allow: [{ pattern: "**/*", actions: ["create", "modify", "delete"] }],
            deny: [{ pattern: "**/*.lock", actions: ["create", "modify", "delete"], reason: "Lock files are protected" }],
          },
        },
      };

      it("deny rules take precedence over allow rules", () => {
        const result = checkMutationForRole(
          "pnpm.lock",
          "modify",
          "impl",
          schemaWithOverlap
        );
        expect(result.policy).toBe("deny");
        expect(result.reason).toBe("Lock files are protected");
      });

      it("allows files not matching deny pattern", () => {
        const result = checkMutationForRole(
          "package.json",
          "modify",
          "impl",
          schemaWithOverlap
        );
        expect(result.policy).toBe("allow");
      });
    });
  });

  describe("parseGovernanceYaml with roles", () => {
    it("parses roles section correctly", () => {
      const yaml = `
mutations:
  allow:
    - pattern: "**/*"
      actions: [create, modify, delete]

roles:
  impl:
    allow:
      - pattern: "packages/**/src/**/*.ts"
        actions: [create, modify]
    deny:
      - pattern: "docs/**"
        actions: [create, modify, delete]
        reason: "impl cannot modify docs"
  control:
    allow:
      - pattern: "docs/**/*.md"
        actions: [create, modify, delete]
    deny:
      - pattern: "packages/**/src/**"
        actions: [create, modify]
`;

      const schema = parseGovernanceYaml(yaml);

      expect(schema.roles).toBeDefined();
      expect(schema.roles?.impl).toBeDefined();
      expect(schema.roles?.control).toBeDefined();

      // Check impl rules
      expect(schema.roles?.impl?.allow).toHaveLength(1);
      expect(schema.roles?.impl?.allow[0].pattern).toBe("packages/**/src/**/*.ts");
      expect(schema.roles?.impl?.allow[0].actions).toEqual(["create", "modify"]);

      expect(schema.roles?.impl?.deny).toHaveLength(1);
      expect(schema.roles?.impl?.deny[0].pattern).toBe("docs/**");
      expect(schema.roles?.impl?.deny[0].reason).toBe("impl cannot modify docs");

      // Check control rules
      expect(schema.roles?.control?.allow).toHaveLength(1);
      expect(schema.roles?.control?.deny).toHaveLength(1);
    });

    it("handles schema without roles section", () => {
      const yaml = `
mutations:
  allow:
    - pattern: "**/*"
      actions: [create, modify, delete]
`;

      const schema = parseGovernanceYaml(yaml);

      expect(schema.roles).toBeUndefined();
      expect(schema.mutations.allow).toHaveLength(1);
    });

    it("handles partial role definitions", () => {
      const yaml = `
mutations:
  allow:
    - pattern: "**/*"
      actions: [create, modify, delete]

roles:
  impl:
    allow:
      - pattern: "src/**"
        actions: [create, modify]
`;

      const schema = parseGovernanceYaml(yaml);

      expect(schema.roles?.impl).toBeDefined();
      expect(schema.roles?.control).toBeUndefined();
    });
  });

  describe("backward compatibility", () => {
    it("existing governance checks remain functional", () => {
      const schema: GovernanceSchema = {
        mutations: {
          allow: [{ pattern: "src/**/*.ts", actions: ["create", "modify"] }],
          approve: [{ pattern: "migrations/*.sql", actions: ["create"], reason: "Review required" }],
          deny: [{ pattern: "*.env", actions: ["create", "modify", "delete"] }],
        },
        roles: {
          impl: {
            allow: [{ pattern: "src/**/*", actions: ["create", "modify"] }],
            deny: [],
          },
        },
      };

      // Role-based check should work
      const roleResult = checkMutationForRole("src/index.ts", "create", "impl", schema);
      expect(roleResult.policy).toBe("allow");

      // Schema structure should be valid
      expect(schema.mutations.allow).toHaveLength(1);
      expect(schema.mutations.approve).toHaveLength(1);
      expect(schema.mutations.deny).toHaveLength(1);
    });
  });
});
