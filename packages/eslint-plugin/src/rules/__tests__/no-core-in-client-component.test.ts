/**
 * Tests for no-core-in-client-component rule
 *
 * @design-doc docs/design/core/features/agent-feedback.md
 * @user-intent "Prevent webpack bundling errors by catching @choragen/core imports in client components at lint time"
 * @test-type unit
 *
 * ADR: ADR-002-governance-schema
 * CR: CR-20251214-001
 */

import { describe, it, expect } from "vitest";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";
import rule from "../no-core-in-client-component.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: tsParser,
  },
});

describe("no-core-in-client-component", () => {
  it("should be a valid ESLint rule", () => {
    expect(rule).toBeDefined();
    expect(rule.meta).toBeDefined();
    expect(rule.create).toBeInstanceOf(Function);
  });

  ruleTester.run("no-core-in-client-component", rule, {
    valid: [
      // Server component can import anything
      {
        code: `import { FeedbackManager } from "@choragen/core";`,
      },
      // Type-only import in client component is allowed
      {
        code: `"use client";
import type { WorkflowMessage } from "@choragen/core";`,
      },
      // Type-only import with multiple types
      {
        code: `"use client";
import type { WorkflowMessage, FeedbackItem } from "@choragen/core";`,
      },
      // Import from @choragen/contracts is allowed
      {
        code: `"use client";
import { HttpStatus } from "@choragen/contracts";`,
      },
      // Other packages are allowed
      {
        code: `"use client";
import { useState } from "react";`,
      },
      // Server component with runtime import
      {
        code: `import { ChainManager } from "@choragen/core";
export default function Page() {}`,
      },
      // Mixed: type import from core, runtime from contracts
      {
        code: `"use client";
import type { WorkflowMessage } from "@choragen/core";
import { HttpStatus } from "@choragen/contracts";`,
      },
    ],
    invalid: [
      // Runtime import in client component
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
      // Default import in client component
      {
        code: `"use client";
import core from "@choragen/core";`,
        errors: [{ messageId: "noRuntimeImport" }],
      },
      // Namespace import in client component
      {
        code: `"use client";
import * as core from "@choragen/core";`,
        errors: [{ messageId: "noRuntimeImport" }],
      },
      // Mixed type and runtime import (runtime should be flagged)
      {
        code: `"use client";
import { FeedbackManager, type WorkflowMessage } from "@choragen/core";`,
        errors: [{ messageId: "noRuntimeImport" }],
      },
    ],
  });
});
