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

export const rules = {
  // Traceability rules
  "require-adr-reference": requireAdrReference,
  "require-test-metadata": requireTestMetadata,

  // Contract rules
  "require-design-contract": requireDesignContract,

  // Code hygiene rules
  "no-as-unknown": noAsUnknown,
  "no-magic-numbers-http": noMagicNumbersHttp,
};

export default rules;
