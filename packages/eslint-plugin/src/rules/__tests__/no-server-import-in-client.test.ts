/**
 * Tests for no-server-import-in-client rule
 *
 * @design-doc docs/design/core/features/agent-feedback.md
 * @user-intent "Prevent webpack bundling errors by catching server-only imports in client components at lint time"
 * @test-type unit
 *
 * ADR: ADR-002-governance-schema
 * FR: FR-20251214-002
 */

import { describe, it, expect } from "vitest";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";
import rule from "../no-server-import-in-client.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: tsParser,
  },
});

describe("no-server-import-in-client", () => {
  it("should be a valid ESLint rule", () => {
    expect(rule).toBeDefined();
    expect(rule.meta).toBeDefined();
    expect(rule.create).toBeInstanceOf(Function);
  });

  ruleTester.run("no-server-import-in-client", rule, {
    valid: [
      // Server component (no "use client") can import anything
      {
        code: `import { FeedbackManager } from "@choragen/core";`,
      },
      // Type-only import is allowed in client component
      {
        code: `"use client";
import type { WorkflowMessage } from "@choragen/core";`,
      },
      // Multiple type imports allowed
      {
        code: `"use client";
import type { WorkflowMessage, FeedbackItem } from "@choragen/core";`,
      },
      // Other packages are allowed by default
      {
        code: `"use client";
import { HttpStatus } from "@choragen/contracts";`,
      },
      // React imports allowed
      {
        code: `"use client";
import { useState } from "react";`,
      },
      // Server component can import @choragen/core
      {
        code: `import { ChainManager } from "@choragen/core";
export default function Page() {}`,
      },
      // Mixed type and runtime from allowed package
      {
        code: `"use client";
import type { WorkflowMessage } from "@choragen/core";
import { HttpStatus } from "@choragen/contracts";`,
      },
      // Custom packages config - unlisted package allowed
      {
        code: `"use client";
import { something } from "@choragen/core";`,
        options: [{ packages: ["@other/package"] }],
      },
    ],
    invalid: [
      // Runtime import from @choragen/core in client component
      {
        code: `"use client";
import { FeedbackManager } from "@choragen/core";`,
        errors: [{ messageId: "noRuntimeImport" }],
      },
      // Multiple runtime imports
      {
        code: `"use client";
import { FeedbackManager, ChainManager } from "@choragen/core";`,
        errors: [{ messageId: "noRuntimeImport" }],
      },
      // Default import
      {
        code: `"use client";
import core from "@choragen/core";`,
        errors: [{ messageId: "noRuntimeImport" }],
      },
      // Namespace import
      {
        code: `"use client";
import * as core from "@choragen/core";`,
        errors: [{ messageId: "noRuntimeImport" }],
      },
      // Mixed type and runtime import (runtime should error)
      {
        code: `"use client";
import { FeedbackManager, type WorkflowMessage } from "@choragen/core";`,
        errors: [{ messageId: "noRuntimeImport" }],
      },
      // Custom package config
      {
        code: `"use client";
import { db } from "@/server/db";`,
        options: [{ packages: ["@/server/db"] }],
        errors: [{ messageId: "noRuntimeImport" }],
      },
      // Glob pattern matching
      {
        code: `"use client";
import { something } from "@/server/utils";`,
        options: [{ packages: ["@/server/*"] }],
        errors: [{ messageId: "noRuntimeImport" }],
      },
      // Glob pattern with **
      {
        code: `"use client";
import { deep } from "@/server/nested/deep/module";`,
        options: [{ packages: ["@/server/**"] }],
        errors: [{ messageId: "noRuntimeImport" }],
      },
      // Custom message
      {
        code: `"use client";
import { prisma } from "@prisma/client";`,
        options: [
          {
            packages: [
              {
                pattern: "@prisma/client",
                message: "Prisma can only be used in server components.",
              },
            ],
          },
        ],
        errors: [
          {
            messageId: "noRuntimeImport",
            data: {
              package: "@prisma/client",
              suggestion: "Prisma can only be used in server components.",
            },
          },
        ],
      },
    ],
  });
});
