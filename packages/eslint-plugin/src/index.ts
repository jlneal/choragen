/**
 * @choragen/eslint-plugin
 *
 * ESLint rules for agentic development:
 * - Traceability (ADR references, design doc chains, CR/FR links)
 * - Test quality (metadata, coverage, assertions)
 * - Contracts (design contracts, pre/postconditions)
 * - Code hygiene (no-as-unknown, error handling)
 */

import { rules } from "./rules/index.js";

export { rules };

export const configs = {
  recommended: {
    plugins: ["@choragen"],
    rules: {
      "@choragen/require-adr-reference": "warn",
      "@choragen/require-test-metadata": "warn",
    },
  },
  strict: {
    plugins: ["@choragen"],
    rules: {
      "@choragen/require-adr-reference": "error",
      "@choragen/require-test-metadata": "error",
    },
  },
};

export default { rules, configs };
