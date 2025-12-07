// ADR: ADR-005-design-contract-api

import type { ContractOptions, ContractResult, DesignContractOptions } from "./types.js";

/**
 * Symbol to store design contract metadata on wrapped handlers
 */
const DESIGN_CONTRACT_METADATA = Symbol("designContractMetadata");

/**
 * Metadata attached to a wrapped handler
 */
export interface DesignContractMetadata {
  designDoc: string;
}

/**
 * A handler wrapped with DesignContract
 */
export type WrappedHandler<TRequest, TResponse> = ((
  request: TRequest
) => TResponse | Promise<TResponse>) & {
  [DESIGN_CONTRACT_METADATA]: DesignContractMetadata;
};

/**
 * Wrap an API route handler with design document traceability.
 *
 * This is the primary API for linking handlers to design documents.
 * The wrapped handler behaves identically to the original but carries
 * metadata that can be inspected by tooling and tests.
 *
 * @example
 * ```typescript
 * import { DesignContract } from "@choragen/contracts";
 *
 * export const GET = DesignContract({
 *   designDoc: "docs/design/core/features/task-management.md",
 *   handler: async (request: Request) => {
 *     return Response.json({ tasks: [] });
 *   },
 * });
 * ```
 */
export function DesignContract<TRequest = Request, TResponse = Response>(
  options: DesignContractOptions<TRequest, TResponse>
): WrappedHandler<TRequest, TResponse> {
  const { designDoc, handler } = options;

  // Create wrapped handler that preserves the original behavior
  const wrappedHandler = ((request: TRequest) => {
    return handler(request);
  }) as WrappedHandler<TRequest, TResponse>;

  // Attach metadata for tooling/testing
  wrappedHandler[DESIGN_CONTRACT_METADATA] = { designDoc };

  return wrappedHandler;
}

/**
 * Check if a handler is wrapped with DesignContract
 */
export function isDesignContract<TRequest, TResponse>(
  handler: unknown
): handler is WrappedHandler<TRequest, TResponse> {
  return (
    typeof handler === "function" &&
    DESIGN_CONTRACT_METADATA in handler
  );
}

/**
 * Get the design contract metadata from a wrapped handler
 */
export function getDesignContractMetadata(
  handler: unknown
): DesignContractMetadata | null {
  if (isDesignContract(handler)) {
    return handler[DESIGN_CONTRACT_METADATA];
  }
  return null;
}

/**
 * Advanced contract builder with pre/postcondition validation.
 *
 * Use this when you need runtime validation of inputs and outputs
 * against contract conditions. For simple design doc traceability,
 * use the `DesignContract` function instead.
 *
 * @example
 * ```typescript
 * const contract = new DesignContractBuilder<Input, Output>({
 *   designDoc: "docs/design/...",
 *   userIntent: "Create a new task",
 * })
 *   .pre((input) => input.title ? null : "Title is required")
 *   .post((output) => output.id ? null : "Must return ID");
 * ```
 */
export class DesignContractBuilder<TInput, TOutput> {
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
