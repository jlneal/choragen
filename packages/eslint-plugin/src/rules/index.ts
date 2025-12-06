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
import requireBidirectionalTestLinks from "./require-bidirectional-test-links.js";
import requireCrFrExists from "./require-cr-fr-exists.js";
import requireDesignDocChain from "./require-design-doc-chain.js";
import requireDesignDocCompleteness from "./require-design-doc-completeness.js";
import requireAdrImplementation from "./require-adr-implementation.js";
import requireAdrRelevance from "./require-adr-relevance.js";
import requireMeaningfulTestCoverage from "./require-meaningful-test-coverage.js";
import requireSemanticUserIntent from "./require-semantic-user-intent.js";
import requireSignificantChangeTraceability from "./require-significant-change-traceability.js";
import requireTestExercisesComponent from "./require-test-exercises-component.js";
import requireTestExercisesRoute from "./require-test-exercises-route.js";
import requireTestForApiRoute from "./require-test-for-api-route.js";
import requireTestForComponent from "./require-test-for-component.js";
import requireTestForLibExport from "./require-test-for-lib-export.js";
import requirePostconditionSemantics from "./require-postcondition-semantics.js";
import requirePreconditionSemantics from "./require-precondition-semantics.js";
import noTrivialContractConditions from "./no-trivial-contract-conditions.js";

export const rules = {
  // Traceability rules
  "require-adr-reference": requireAdrReference,
  "require-test-metadata": requireTestMetadata,
  "no-untracked-todos": noUntrackedTodos,
  "require-new-file-traceability": requireNewFileTraceability,
  "require-cr-fr-exists": requireCrFrExists,
  "require-design-doc-chain": requireDesignDocChain,
  "require-design-doc-completeness": requireDesignDocCompleteness,
  "require-adr-implementation": requireAdrImplementation,
  "require-adr-relevance": requireAdrRelevance,
  "require-significant-change-traceability": requireSignificantChangeTraceability,

  // Contract rules
  "require-design-contract": requireDesignContract,
  "require-postcondition-semantics": requirePostconditionSemantics,
  "require-precondition-semantics": requirePreconditionSemantics,
  "no-trivial-contract-conditions": noTrivialContractConditions,

  // Code hygiene rules
  "no-as-unknown": noAsUnknown,
  "no-magic-numbers-http": noMagicNumbersHttp,
  "require-eslint-disable-justification": requireEslintDisableJustification,
  "max-eslint-disables-per-file": maxEslintDisablesPerFile,

  // Test quality rules
  "no-trivial-assertions": noTrivialAssertions,
  "require-test-assertions": requireTestAssertions,
  "require-bidirectional-test-links": requireBidirectionalTestLinks,
  "require-meaningful-test-coverage": requireMeaningfulTestCoverage,
  "require-semantic-user-intent": requireSemanticUserIntent,
  "require-test-exercises-component": requireTestExercisesComponent,
  "require-test-exercises-route": requireTestExercisesRoute,
  "require-test-for-api-route": requireTestForApiRoute,
  "require-test-for-component": requireTestForComponent,
  "require-test-for-lib-export": requireTestForLibExport,
};

export default rules;
