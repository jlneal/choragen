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
      "@choragen/require-bidirectional-test-links": "warn",
      "@choragen/require-cr-fr-exists": "warn",
      "@choragen/require-design-doc-chain": "warn",
      "@choragen/require-design-doc-completeness": "warn",
      "@choragen/require-adr-implementation": "warn",
      "@choragen/require-adr-relevance": "warn",
      "@choragen/require-significant-change-traceability": "warn",

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
      "@choragen/require-meaningful-test-coverage": "warn",
      "@choragen/require-semantic-user-intent": "warn",
      "@choragen/require-test-exercises-component": "warn",
      "@choragen/require-test-exercises-route": "warn",
      "@choragen/require-test-for-api-route": "warn",
      "@choragen/require-test-for-component": "warn",
      "@choragen/require-test-for-lib-export": "warn",
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
      "@choragen/require-bidirectional-test-links": "error",
      "@choragen/require-cr-fr-exists": "error",
      "@choragen/require-design-doc-chain": "error",
      "@choragen/require-design-doc-completeness": "error",
      "@choragen/require-adr-implementation": "error",
      "@choragen/require-adr-relevance": "error",
      "@choragen/require-significant-change-traceability": "error",

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
      "@choragen/require-meaningful-test-coverage": "error",
      "@choragen/require-semantic-user-intent": "error",
      "@choragen/require-test-exercises-component": "error",
      "@choragen/require-test-exercises-route": "error",
      "@choragen/require-test-for-api-route": "error",
      "@choragen/require-test-for-component": "error",
      "@choragen/require-test-for-lib-export": "error",
    },
  },
};

export default { rules, configs };
