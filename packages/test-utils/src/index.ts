/**
 * @choragen/test-utils
 *
 * Test utilities for agentic development:
 * - unsafeCast for type-safe partial mocks
 * - Structured test output parsing
 * - Design impact analysis
 *
 * Will be extracted from itinerary-planner in Phase 3.
 */

/**
 * Type-safe cast for partial mocks in tests.
 *
 * Use this instead of `as unknown as T` to avoid lint errors
 * while still getting type safety for the properties you define.
 *
 * @example
 * const mockClient = unsafeCast<SupabaseClient>({
 *   from: vi.fn(),
 *   rpc: vi.fn(),
 * });
 */
export function unsafeCast<T>(partial: Partial<T>): T {
  return partial as T;
}

// Placeholder exports - implementation in Phase 3
export const TestOutputParser = {
  // TODO: Implement in CR-20251205-006
};

export const DesignImpactAnalyzer = {
  // TODO: Implement in CR-20251205-006
};
