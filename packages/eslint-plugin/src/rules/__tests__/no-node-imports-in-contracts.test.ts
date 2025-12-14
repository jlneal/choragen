/**
 * Tests for no-node-imports-in-contracts rule
 *
 * @design-doc docs/design/core/features/eslint-plugin.md
 * @user-intent "Keep @choragen/contracts client-safe by blocking Node.js built-in imports at lint time"
 * @test-type unit
 *
 * ADR: ADR-002-governance-schema
 * CR: CR-20251214-003
 */

import { describe, it, expect } from "vitest";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";
import rule from "../no-node-imports-in-contracts.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: tsParser,
  },
});

describe("no-node-imports-in-contracts", () => {
  it("should be a valid ESLint rule", () => {
    expect(rule).toBeDefined();
    expect(rule.meta).toBeDefined();
    expect(rule.create).toBeInstanceOf(Function);
  });

  ruleTester.run("no-node-imports-in-contracts", rule, {
    valid: [
      // Non-contracts files are ignored
      {
        code: `import fs from "fs";`,
        filename: "/Users/dev/Projects/choragen/packages/core/src/index.ts",
      },
      // Contracts file with safe imports
      {
        code: `import { HttpStatus } from "@choragen/contracts";
import { something } from "./local";`,
        filename: "/Users/dev/Projects/choragen/packages/contracts/src/types.ts",
      },
      // Scoped package import inside contracts
      {
        code: `import { z } from "zod";`,
        filename: "C:\\repo\\choragen\\packages\\contracts\\src\\schema.ts",
      },
      // Relative import that happens to include node keyword
      {
        code: `import { nodeHelper } from "./node-utils";`,
        filename: "/Users/dev/Projects/choragen/packages/contracts/src/helpers/node.ts",
      },
    ],
    invalid: [
      // Bare Node.js built-in in contracts file
      {
        code: `import fs from "fs";`,
        filename: "/Users/dev/Projects/choragen/packages/contracts/src/index.ts",
        errors: [
          {
            message:
              "Node.js import 'fs' is not allowed in @choragen/contracts. This package must remain client-safe. Move Node.js-specific code to @choragen/core.",
          },
        ],
      },
      // node: protocol import
      {
        code: `import { createHash } from "node:crypto";`,
        filename: "/Users/dev/Projects/choragen/packages/contracts/src/crypto.ts",
        errors: [{ messageId: "noNodeImport", data: { module: "node:crypto" } }],
      },
      // Another built-in module
      {
        code: `import path from "path";`,
        filename: "/Users/dev/Projects/choragen/packages/contracts/src/pathing.ts",
        errors: [{ messageId: "noNodeImport", data: { module: "path" } }],
      },
      // Type-only import still blocked
      {
        code: `import type { Worker } from "worker_threads";`,
        filename: "C:\\repo\\choragen\\packages\\contracts\\src\\workers.ts",
        errors: [{ messageId: "noNodeImport", data: { module: "worker_threads" } }],
      },
      // Multiple imports; ensure each node built-in is caught (single error is fine)
      {
        code: `import http from "http";
import { readFile } from "fs";`,
        filename: "/Users/dev/Projects/choragen/packages/contracts/src/http.ts",
        errors: [
          { messageId: "noNodeImport", data: { module: "http" } },
          { messageId: "noNodeImport", data: { module: "fs" } },
        ],
      },
    ],
  });
});
