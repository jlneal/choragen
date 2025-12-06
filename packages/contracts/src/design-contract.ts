// ADR: ADR-002-governance-schema

import type { ContractOptions, ContractResult } from "./types.js";

/**
 * Runtime design contract wrapper
 *
 * Validates that implementation matches design intent at runtime boundaries.
 * Used to wrap API route handlers, ensuring preconditions and postconditions
 * are checked against the design document.
 */
export class DesignContract<TInput, TOutput> {
  private readonly options: ContractOptions;
  private preconditions: Array<(input: TInput) => string | null> = [];
  private postconditions: Array<(output: TOutput) => string | null> = [];

  constructor(options: ContractOptions) {
    this.options = options;
  }

  /**
   * Add a precondition check
   * @param check Function that returns error message if violated, null if ok
   */
  pre(check: (input: TInput) => string | null): this {
    this.preconditions.push(check);
    return this;
  }

  /**
   * Add a postcondition check
   * @param check Function that returns error message if violated, null if ok
   */
  post(check: (output: TOutput) => string | null): this {
    this.postconditions.push(check);
    return this;
  }

  /**
   * Validate input against preconditions
   */
  validateInput(input: TInput): ContractResult<TInput> {
    const violations: string[] = [];

    for (const check of this.preconditions) {
      const error = check(input);
      if (error) {
        violations.push(error);
      }
    }

    if (violations.length > 0) {
      return { success: false, violations };
    }

    return { success: true, data: input };
  }

  /**
   * Validate output against postconditions
   */
  validateOutput(output: TOutput): ContractResult<TOutput> {
    const violations: string[] = [];

    for (const check of this.postconditions) {
      const error = check(output);
      if (error) {
        violations.push(error);
      }
    }

    if (violations.length > 0) {
      return { success: false, violations };
    }

    return { success: true, data: output };
  }

  /**
   * Get contract metadata for documentation/tracing
   */
  getMetadata() {
    return {
      designDoc: this.options.designDoc,
      userIntent: this.options.userIntent,
      preconditionCount: this.preconditions.length,
      postconditionCount: this.postconditions.length,
    };
  }
}
