// ADR: ADR-002-governance-schema

/**
 * Contract types
 */

/**
 * Options for the DesignContract function wrapper (simple API)
 */
export interface DesignContractOptions<TRequest = Request, TResponse = Response> {
  /** Design document this handler implements */
  designDoc: string;
  /** Optional operation name for governance traceability */
  name?: string;
  /** Optional preconditions metadata (enforced by linters) */
  preconditions?: unknown;
  /** Optional postconditions metadata (enforced by linters) */
  postconditions?: unknown;
  /** The handler function to wrap */
  handler: (request: TRequest) => TResponse | Promise<TResponse>;
}

/**
 * Options for DesignContractBuilder (advanced API with pre/postconditions)
 */
export interface ContractOptions {
  /** Design document this contract validates */
  designDoc: string;
  /** User intent being validated */
  userIntent?: string;
  /** Whether to throw on violation (default: true) */
  throwOnViolation?: boolean;
}

export interface ContractResult<T> {
  success: boolean;
  data?: T;
  violations?: string[];
}
