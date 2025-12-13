/**
 * @design-doc docs/design/core/features/standard-workflow.md
 * @test-type unit
 * @user-intent "Validate chain file-scope overlap detection for parallel execution"
 */

import { describe, it, expect } from "vitest";
import type { Chain } from "../../tasks/types.js";
import { scopesOverlap, detectScopeConflicts } from "../scope-validator.js";

function makeChain(id: string, fileScope: string[]): Chain {
  return {
    id,
    sequence: 1,
    slug: id.toLowerCase(),
    requestId: "CR-001",
    title: id,
    description: "",
    fileScope,
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("scope validator", () => {
  it("detects overlapping scopes", () => {
    const a = makeChain("CHAIN-A", ["src/**"]);
    const b = makeChain("CHAIN-B", ["src/utils/**"]);

    expect(scopesOverlap(a, b)).toBe(true);

    const conflicts = detectScopeConflicts([a, b]);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].patterns.length).toBeGreaterThan(0);
  });

  it("allows non-overlapping scopes", () => {
    const a = makeChain("CHAIN-A", ["src/api/**"]);
    const b = makeChain("CHAIN-B", ["docs/**"]);

    expect(scopesOverlap(a, b)).toBe(false);

    const conflicts = detectScopeConflicts([a, b]);
    expect(conflicts.length).toBe(0);
  });

  it("ignores chains with empty scope", () => {
    const a = makeChain("CHAIN-A", []);
    const b = makeChain("CHAIN-B", ["src/**"]);

    expect(scopesOverlap(a, b)).toBe(false);
    expect(detectScopeConflicts([a, b])).toEqual([]);
  });
});
