// ADR: ADR-001-task-file-format

import { ChainManager } from "./chain-manager.js";
import type { Chain } from "./types.js";
import { matchGlob } from "../utils/index.js";

function materializePattern(pattern: string): string {
  return pattern
    .split("/")
    .map((segment) => {
      if (segment === "**") {
        return "deep";
      }
      return segment.replace(/\*/g, "x").replace(/\?/g, "a");
    })
    .join("/");
}

function matchesPattern(pattern: string, candidate: string): boolean {
  if (!pattern || !candidate) {
    return false;
  }

  if (matchGlob(pattern, candidate)) {
    return true;
  }

  if (pattern.endsWith("/**")) {
    const base = pattern.slice(0, -3);
    if (candidate.startsWith(base)) {
      return true;
    }
  }

  return false;
}

function patternsOverlap(patternA: string, patternB: string): boolean {
  if (!patternA || !patternB) {
    return false;
  }

  if (matchesPattern(patternA, patternB) || matchesPattern(patternB, patternA)) {
    return true;
  }

  const concreteA = materializePattern(patternA);
  const concreteB = materializePattern(patternB);

  return matchesPattern(patternA, concreteB) || matchesPattern(patternB, concreteA);
}

export function hasOverlap(scopeA: string[] = [], scopeB: string[] = []): boolean {
  if (scopeA.length === 0 || scopeB.length === 0) {
    return false;
  }

  return scopeA.some((patternA) =>
    scopeB.some((patternB) => patternsOverlap(patternA, patternB))
  );
}

export function getOverlappingPatterns(scopeA: string[] = [], scopeB: string[] = []): string[] {
  const overlaps = new Set<string>();

  for (const patternA of scopeA) {
    for (const patternB of scopeB) {
      if (patternsOverlap(patternA, patternB)) {
        overlaps.add(patternA);
        overlaps.add(patternB);
      }
    }
  }

  return Array.from(overlaps);
}

export async function findConflictingChains(
  chainId: string,
  projectRoot = process.cwd()
): Promise<Chain[]> {
  const chainManager = new ChainManager(projectRoot);
  const allChains = await chainManager.getAllChains();
  const targetChain = allChains.find((chain) => chain.id === chainId);

  if (!targetChain) {
    return [];
  }

  const targetScope = targetChain.fileScope || [];
  if (targetScope.length === 0) {
    return [];
  }

  return allChains.filter(
    (chain) =>
      chain.id !== chainId && hasOverlap(targetScope, chain.fileScope || [])
  );
}
