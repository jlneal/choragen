/**
 * @choragen/eslint-plugin
 *
 * ESLint rules for agentic development:
 * - Traceability (ADR references, design doc chains, CR/FR links)
 * - Test quality (metadata, coverage, assertions)
 * - Contracts (design contracts, pre/postconditions)
 * - Code hygiene (no-as-unknown, error handling)
 *
 * Rules will be extracted from itinerary-planner in Phase 3.
 */

// Placeholder - implementation in CR-20251205-006
export const rules = {
  // Traceability rules
  // "require-adr-reference": {},
  // "require-design-doc-chain": {},
  // "require-cr-fr-exists": {},
  // "require-new-file-traceability": {},

  // Test quality rules
  // "require-test-metadata": {},
  // "require-meaningful-test-coverage": {},
  // "require-test-assertions": {},

  // Contract rules
  // "require-design-contract": {},
  // "require-precondition-semantics": {},
  // "require-postcondition-semantics": {},

  // Code hygiene rules
  // "no-as-unknown": {},
  // "require-error-handler": {},
};

export const configs = {
  recommended: {
    plugins: ["@choragen"],
    rules: {
      // Will be populated in Phase 3
    },
  },
  strict: {
    plugins: ["@choragen"],
    rules: {
      // Will be populated in Phase 3
    },
  },
};

export default { rules, configs };
