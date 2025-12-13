// ADR: ADR-001-task-file-format

/**
 * Parallel chain spawning with scope validation.
 */

import type { Chain } from "../tasks/types.js";
import { detectScopeConflicts } from "./scope-validator.js";

export interface SpawnChainsOptions {
  chains: Chain[];
  spawn: (chain: Chain) => Promise<void>;
}

export interface SpawnChainsResult {
  spawned: string[];
}

export async function spawnChainsInParallel(
  options: SpawnChainsOptions
): Promise<SpawnChainsResult> {
  const { chains, spawn } = options;

  const conflicts = detectScopeConflicts(chains);
  if (conflicts.length > 0) {
    const details = conflicts
      .map((c) => `${c.chain.id} ↔ ${c.conflictingWith.map((x) => x.id).join(", ")} [${c.patterns.join(", ")}]`)
      .join("; ");
    throw new Error(`Cannot spawn chains in parallel due to scope conflicts: ${details}`);
  }

  await Promise.all(chains.map((chain) => spawn(chain)));

  return { spawned: chains.map((c) => c.id) };
}
