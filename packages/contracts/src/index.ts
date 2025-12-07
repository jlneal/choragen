/**
 * @choragen/contracts
 *
 * Runtime design contracts for validating intent at boundaries.
 * Extracted from itinerary-planner in Phase 3.
 */

// Primary API - function wrapper for API routes
export {
  DesignContract,
  DesignContractBuilder,
  isDesignContract,
  getDesignContractMetadata,
} from "./design-contract.js";
export type { DesignContractMetadata, WrappedHandler } from "./design-contract.js";

// Error handling
export { ApiError } from "./api-error.js";
export { HttpStatus } from "./http-status.js";

// Types
export type {
  DesignContractOptions,
  ContractOptions,
  ContractResult,
} from "./types.js";
