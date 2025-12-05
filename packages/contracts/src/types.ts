/**
 * Contract types
 */

export interface ContractOptions {
  /** Design document this contract validates */
  designDoc: string;
  /** User intent being validated */
  userIntent: string;
  /** Whether to throw on violation (default: true) */
  throwOnViolation?: boolean;
}

export interface ContractResult<T> {
  success: boolean;
  data?: T;
  violations?: string[];
}
