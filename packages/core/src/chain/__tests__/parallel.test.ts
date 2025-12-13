/**
 * @design-doc docs/design/core/features/standard-workflow.md
 * @test-type unit
 * @user-intent "Ensure parallel chain spawning respects scope conflicts"
 */

import { describe, it, expect } from "vitest";
import type { Chain } from "../../tasks/types.js";
import { spawnChainsInParallel } from "../parallel.js";

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

describe("spawnChainsInParallel", () => {
  it("spawns all chains when scopes do not overlap", async () => {
    const spawned: string[] = [];
    const chains = [
      makeChain("CHAIN-A", ["src/api/**"]),
      makeChain("CHAIN-B", ["docs/**"]),
    ];

    const result = await spawnChainsInParallel({
      chains,
      spawn: async (chain) => {
        spawned.push(chain.id);
      },
    });

    expect(result.spawned).toEqual(["CHAIN-A", "CHAIN-B"]);
    expect(spawned).toEqual(["CHAIN-A", "CHAIN-B"]);
  });

  it("throws when scopes overlap", async () => {
    const chains = [
      makeChain("CHAIN-A", ["src/**"]),
      makeChain("CHAIN-B", ["src/utils/**"]),
    ];

    await expect(
      spawnChainsInParallel({
        chains,
        spawn: async () => {
          throw new Error("should not spawn");
        },
      })
    ).rejects.toThrow(/scope conflicts/i);
  });
});
