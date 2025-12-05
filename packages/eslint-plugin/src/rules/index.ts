/**
 * ESLint rules index
 */

import requireAdrReference from "./require-adr-reference.js";
import requireTestMetadata from "./require-test-metadata.js";

export const rules = {
  "require-adr-reference": requireAdrReference,
  "require-test-metadata": requireTestMetadata,
  // Future rules to be extracted from itinerary-planner:
  // "require-design-doc-chain": {},
  // "require-cr-fr-exists": {},
  // "require-design-contract": {},
  // "no-as-unknown": {},
  // "no-magic-numbers-http": {},
};

export default rules;
