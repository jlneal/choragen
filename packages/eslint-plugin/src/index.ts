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

      // Contracts
      "@choragen/require-design-contract": "warn",

      // Code hygiene
      "@choragen/no-as-unknown": "warn",
      "@choragen/no-magic-numbers-http": "warn",
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

      // Contracts
      "@choragen/require-design-contract": "error",

      // Code hygiene
      "@choragen/no-as-unknown": "error",
      "@choragen/no-magic-numbers-http": "error",
    },
  },
};

export default { rules, configs };
