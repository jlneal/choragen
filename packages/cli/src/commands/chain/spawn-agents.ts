// ADR: ADR-001-task-file-format

/**
 * chain:spawn-agents command - spawn agents for multiple chains in parallel when scopes allow.
 */

import { ChainManager, spawnChainsInParallel, detectScopeConflicts } from "@choragen/core";

export interface SpawnAgentsResult {
  success: boolean;
  spawned?: string[];
  error?: string;
}

export async function spawnAgents(
  projectRoot: string,
  chainIds: string[],
  spawner?: (chainId: string) => Promise<void>
): Promise<SpawnAgentsResult> {
  const chainManager = new ChainManager(projectRoot);
  const chains = [];

  for (const id of chainIds) {
    const chain = await chainManager.getChain(id);
    if (!chain) {
      return { success: false, error: `Chain not found: ${id}` };
    }
    chains.push(chain);
  }

  const conflicts = detectScopeConflicts(chains);
  if (conflicts.length > 0) {
    const message = conflicts
      .map(
        (c) =>
          `${c.chain.id} conflicts with ${c.conflictingWith.map((x) => x.id).join(", ")} on patterns: ${c.patterns.join(", ")}`
      )
      .join("\n");
    return { success: false, error: message };
  }

  const spawnFn =
    spawner ||
    (async (chainId: string) => {
      // Placeholder spawn hook; real implementation would launch agent session
      console.log(`Spawning agent for ${chainId}...`);
    });

  await spawnChainsInParallel({
    chains,
    spawn: (chain) => spawnFn(chain.id),
  });

  return {
    success: true,
    spawned: chains.map((c) => c.id),
  };
}
