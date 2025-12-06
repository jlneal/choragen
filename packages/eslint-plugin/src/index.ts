/**
 * @choragen/eslint-plugin
 *
 * ESLint rules for agentic development:
 * - Traceability (ADR references, design doc chains, CR/FR links)
 * - Test quality (metadata, coverage, assertions)
 * - Contracts (design contracts, pre/postconditions)
 * - Code hygiene (no-as-unknown, error handling)
 *
 * ADR: ADR-002-governance-schema
 */

import { rules } from "./rules/index.js";

export { rules };

export const configs = {
  /**
   * Recommended config - warnings for most rules
   */
  recommended: {
    plugins: ["@choragen"],
    rules: {
      // Traceability
      "@choragen/require-adr-reference": "warn",
      "@choragen/require-test-metadata": "warn",
      "@choragen/no-untracked-todos": "warn",
      "@choragen/require-new-file-traceability": "warn",

      // Contracts
      "@choragen/require-design-contract": "warn",

      // Code hygiene
      "@choragen/no-as-unknown": "warn",
      "@choragen/no-magic-numbers-http": "warn",
      "@choragen/require-eslint-disable-justification": "warn",
      "@choragen/max-eslint-disables-per-file": "warn",

      // Test quality
      "@choragen/no-trivial-assertions": "warn",
      "@choragen/require-test-assertions": "warn",
    },
  },

  /**
   * Strict config - errors for all rules
   */
  strict: {
    plugins: ["@choragen"],
    rules: {
      // Traceability
      "@choragen/require-adr-reference": "error",
      "@choragen/require-test-metadata": "error",
      "@choragen/no-untracked-todos": "error",
      "@choragen/require-new-file-traceability": "error",

      // Contracts
      "@choragen/require-design-contract": "error",

      // Code hygiene
      "@choragen/no-as-unknown": "error",
      "@choragen/no-magic-numbers-http": "error",
      "@choragen/require-eslint-disable-justification": "error",
      "@choragen/max-eslint-disables-per-file": "error",

      // Test quality
      "@choragen/no-trivial-assertions": "error",
      "@choragen/require-test-assertions": "error",
    },
  },
};

export default { rules, configs };
