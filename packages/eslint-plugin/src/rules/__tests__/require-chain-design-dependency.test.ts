/**
 * Tests for require-chain-design-dependency rule
 *
 * @design-doc docs/design/core/features/eslint-plugin.md
 * @test-type unit
 * @user-intent "Validate skeleton wiring for design dependency enforcement"
 *
 * ADR: ADR-002-governance-schema
 * ADR: ADR-006-chain-type-system
 * CR: CR-20251214-006
 */

import { describe, it, expect } from "vitest";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";
import rule from "../require-chain-design-dependency.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: tsParser,
  },
});

describe("require-chain-design-dependency", () => {
  it("exposes rule metadata and create function", () => {
    expect(rule.meta?.messages?.missingDesignDependency).toBeDefined();
    expect(rule.create).toBeInstanceOf(Function);
  });

  ruleTester.run("require-chain-design-dependency", rule, {
    valid: [
      {
        code: `
          ChainManager.create({
            type: "implementation",
            dependsOn: "CHAIN-001-design"
          });
        `,
        filename: "/project/chains/workflow.ts",
      },
      {
        code: `
          ChainManager.create({
            type: "implementation",
            skipDesign: true,
            skipDesignJustification: "Hotfix for production issue",
          });
        `,
        filename: "/project/chains/skip.ts",
      },
      {
        code: `
          ChainManager.create({
            type: "design",
          });
        `,
        filename: "/project/chains/design.ts",
      },
      {
        code: `
          ChainManager.create({
            type: "implementation",
            skipDesign: true,
            skipDesignJustification: "Hotfix for production issue"
          });
        `,
        filename: "/project/chains/workflow.ts",
      },
      {
        code: `
          const chainManager = new ChainManager();
          await chainManager.create({
            type: "implementation",
            dependsOn: "CHAIN-002-design"
          });
        `,
        filename: "/project/chains/instance.ts",
      },
      {
        code: `
          ChainManager.create(buildOptions());
        `,
        filename: "/project/chains/dynamic.ts",
      },
      {
        code: `
          const opts = { type: "implementation", dependsOn: "CHAIN-010-design" };
          ChainManager.create(opts);
        `,
        filename: "/project/chains/variable.ts",
      },
      {
        code: `
          ChainManager.create({
            ...baseOptions,
            type: "implementation",
            dependsOn: "CHAIN-003-design"
          });
        `,
        filename: "/project/chains/spread.ts",
      },
      {
        code: `
          ChainManager.create({
            description: "no type provided"
          });
        `,
        filename: "/project/chains/no-type.ts",
      },
    ],
    invalid: [
      {
        code: `
          ChainManager.create({
            type: "implementation"
          });
        `,
        filename: "/project/chains/missing-dependency.ts",
        errors: [{ messageId: "missingDesignDependency" }],
      },
      {
        code: `
          const chainManager = new ChainManager();
          chainManager.create({
            type: "implementation"
          });
        `,
        filename: "/project/chains/missing-instance.ts",
        errors: [{ messageId: "missingDesignDependency" }],
      },
      {
        code: `
          ChainManager.create({
            type: "implementation",
            skipDesign: true
          });
        `,
        filename: "/project/chains/skip-without-justification.ts",
        errors: [{ messageId: "missingDesignDependency" }],
      },
      {
        code: `
          ChainManager.create({
            type: "implementation",
            skipDesignJustification: "Missing skip flag"
          });
        `,
        filename: "/project/chains/justification-without-skip.ts",
        errors: [{ messageId: "missingDesignDependency" }],
      },
    ],
  });
});
