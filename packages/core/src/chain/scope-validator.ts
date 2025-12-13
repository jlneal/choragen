// ADR: ADR-001-task-file-format

/**
 * Chain file-scope overlap detection.
 */

import type { Chain } from "../tasks/types.js";
import { hasOverlap, getOverlappingPatterns } from "../tasks/scope-utils.js";

export interface ScopeConflict {
  chain: Chain;
  conflictingWith: Chain[];
  patterns: string[];
}

export function scopesOverlap(chainA: Chain, chainB: Chain): boolean {
  return hasOverlap(chainA.fileScope || [], chainB.fileScope || []);
}

export function detectScopeConflicts(chains: Chain[]): ScopeConflict[] {
  const conflicts: ScopeConflict[] = [];

  for (let i = 0; i < chains.length; i++) {
    for (let j = i + 1; j < chains.length; j++) {
      const a = chains[i];
      const b = chains[j];
      if (scopesOverlap(a, b)) {
        conflicts.push({
          chain: a,
          conflictingWith: [b],
          patterns: getOverlappingPatterns(a.fileScope, b.fileScope),
        });
      }
    }
  }

  return conflicts;
}
