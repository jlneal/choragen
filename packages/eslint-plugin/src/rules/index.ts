/**
 * ESLint rules index
 *
 * ADR: ADR-002-governance-schema
 */

import requireAdrReference from "./require-adr-reference.js";
import requireTestMetadata from "./require-test-metadata.js";
import requireDesignContract from "./require-design-contract.js";
import noAsUnknown from "./no-as-unknown.js";
import noMagicNumbersHttp from "./no-magic-numbers-http.js";
import noUntrackedTodos from "./no-untracked-todos.js";
import requireNewFileTraceability from "./require-new-file-traceability.js";
import noTrivialAssertions from "./no-trivial-assertions.js";
import requireTestAssertions from "./require-test-assertions.js";
import requireEslintDisableJustification from "./require-eslint-disable-justification.js";
import maxEslintDisablesPerFile from "./max-eslint-disables-per-file.js";

export const rules = {
  // Traceability rules
  "require-adr-reference": requireAdrReference,
  "require-test-metadata": requireTestMetadata,
  "no-untracked-todos": noUntrackedTodos,
  "require-new-file-traceability": requireNewFileTraceability,

  // Contract rules
  "require-design-contract": requireDesignContract,

  // Code hygiene rules
  "no-as-unknown": noAsUnknown,
  "no-magic-numbers-http": noMagicNumbersHttp,
  "require-eslint-disable-justification": requireEslintDisableJustification,
  "max-eslint-disables-per-file": maxEslintDisablesPerFile,

  // Test quality rules
  "no-trivial-assertions": noTrivialAssertions,
  "require-test-assertions": requireTestAssertions,
};

export default rules;
