/**
 * Lock manager
 *
 * Manages advisory file locks for parallel chain coordination.
 *
 * ADR: ADR-003-file-locking
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type {
  FileLock,
  LockFile,
  LockAcquisitionResult,
  LockConfig,
} from "./types.js";
import { DEFAULT_LOCK_CONFIG, EMPTY_LOCK_FILE } from "./types.js";
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

  if (pattern.endsWith("/**") && candidate.startsWith(pattern.slice(0, -3))) {
    return true;
  }

  return false;
}

/**
 * Check if two glob patterns could match the same file
 */
function patternsOverlap(pattern1: string, pattern2: string): boolean {
  if (matchesPattern(pattern1, pattern2) || matchesPattern(pattern2, pattern1)) {
    return true;
  }

  const concrete1 = materializePattern(pattern1);
  const concrete2 = materializePattern(pattern2);

  return matchesPattern(pattern1, concrete2) || matchesPattern(pattern2, concrete1);
}

function getOverlappingPatterns(scopeA: string[], scopeB: string[]): string[] {
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

export class LockManager {
  private config: LockConfig;
  private projectRoot: string;

  constructor(projectRoot: string, config: Partial<LockConfig> = {}) {
    this.projectRoot = projectRoot;
    this.config = { ...DEFAULT_LOCK_CONFIG, ...config };
  }

  /**
   * Get the full path to the lock file
   */
  private getLockFilePath(): string {
    return path.join(this.projectRoot, this.config.lockFilePath);
  }

  /**
   * Read the lock file
   */
  private async readLockFile(): Promise<LockFile> {
    try {
      const content = await fs.readFile(this.getLockFilePath(), "utf-8");
      const data = JSON.parse(content) as LockFile;

      // Convert date strings back to Date objects
      for (const chainId of Object.keys(data.chains)) {
        const lock = data.chains[chainId];
        lock.acquired = new Date(lock.acquired);
        if (lock.expiresAt) {
          lock.expiresAt = new Date(lock.expiresAt);
        }
      }

      return data;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return { ...EMPTY_LOCK_FILE };
      }
      throw error;
    }
  }

  /**
   * Write the lock file
   */
  private async writeLockFile(lockFile: LockFile): Promise<void> {
    const lockDir = path.dirname(this.getLockFilePath());
    await fs.mkdir(lockDir, { recursive: true });
    await fs.writeFile(
      this.getLockFilePath(),
      JSON.stringify(lockFile, null, 2),
      "utf-8"
    );
  }

  /**
   * Clean up expired locks
   */
  private cleanExpiredLocks(lockFile: LockFile): LockFile {
    const now = new Date();
    const cleaned: LockFile = {
      version: lockFile.version,
      chains: {},
    };

    for (const [chainId, lock] of Object.entries(lockFile.chains)) {
      if (!lock.expiresAt || lock.expiresAt > now) {
        cleaned.chains[chainId] = lock;
      }
    }

    return cleaned;
  }

  /**
   * Acquire locks for a chain
   */
  async acquire(
    chainId: string,
    files: string[],
    agent: string
  ): Promise<LockAcquisitionResult> {
    const lockFile = this.cleanExpiredLocks(await this.readLockFile());

    // Check for conflicts with existing locks
    for (const [existingChainId, existingLock] of Object.entries(
      lockFile.chains
    )) {
      if (existingChainId === chainId) continue; // Same chain, skip

      for (const existingPattern of existingLock.files) {
        for (const newPattern of files) {
          if (patternsOverlap(existingPattern, newPattern)) {
            return {
              success: false,
              conflictingChain: existingChainId,
              conflictingPatterns: [existingPattern, newPattern],
              error: `Lock conflict: ${newPattern} overlaps with ${existingPattern} (held by ${existingChainId})`,
            };
          }
        }
      }
    }

    // No conflicts, acquire the lock
    const now = new Date();
    const lock: FileLock = {
      files,
      acquired: now,
      agent,
      expiresAt: new Date(now.getTime() + this.config.defaultExpirationMs),
    };

    lockFile.chains[chainId] = lock;
    await this.writeLockFile(lockFile);

    return {
      success: true,
      lock,
    };
  }

  /**
   * Acquire locks for a chain's file scope
   */
  async acquireForScope(
    chainId: string,
    fileScope: string[],
    agent = chainId
  ): Promise<LockAcquisitionResult> {
    const lockFile = this.cleanExpiredLocks(await this.readLockFile());
    const conflicts = await this.checkScopeConflicts(fileScope, lockFile);

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      return {
        success: false,
        conflictingChain: conflict.chainId,
        conflictingPatterns: conflict.overlappingPatterns,
        error: `Lock conflict: ${conflict.overlappingPatterns.join(", ")} (held by ${conflict.chainId})`,
      };
    }

    return this.acquire(chainId, fileScope, agent);
  }

  /**
   * Check for lock conflicts against the current lock file
   */
  async checkScopeConflicts(
    fileScope: string[],
    existingLockFile?: LockFile
  ): Promise<
    { chainId: string; overlappingPatterns: string[]; lock: FileLock }[]
  > {
    const lockFile = this.cleanExpiredLocks(
      existingLockFile || (await this.readLockFile())
    );

    if (fileScope.length === 0) {
      return [];
    }

    const conflicts: {
      chainId: string;
      overlappingPatterns: string[];
      lock: FileLock;
    }[] = [];

    for (const [existingChainId, lock] of Object.entries(lockFile.chains)) {
      const overlappingPatterns = getOverlappingPatterns(
        fileScope,
        lock.files
      );

      if (overlappingPatterns.length > 0) {
        conflicts.push({
          chainId: existingChainId,
          overlappingPatterns,
          lock,
        });
      }
    }

    return conflicts;
  }

  /**
   * Release locks for a chain
   */
  async release(chainId: string): Promise<boolean> {
    const lockFile = await this.readLockFile();

    if (!lockFile.chains[chainId]) {
      return false; // No lock to release
    }

    delete lockFile.chains[chainId];
    await this.writeLockFile(lockFile);

    return true;
  }

  /**
   * Get the current lock for a chain
   */
  async getLock(chainId: string): Promise<FileLock | null> {
    const lockFile = this.cleanExpiredLocks(await this.readLockFile());
    return lockFile.chains[chainId] || null;
  }

  /**
   * Get all current locks
   */
  async getAllLocks(): Promise<Record<string, FileLock>> {
    const lockFile = this.cleanExpiredLocks(await this.readLockFile());
    return lockFile.chains;
  }

  /**
   * Check if a file is locked by any chain
   */
  async isFileLocked(
    filePath: string
  ): Promise<{ locked: boolean; chainId?: string }> {
    const lockFile = this.cleanExpiredLocks(await this.readLockFile());

    for (const [chainId, lock] of Object.entries(lockFile.chains)) {
      for (const pattern of lock.files) {
        if (matchGlob(pattern, filePath)) {
          return { locked: true, chainId };
        }
      }
    }

    return { locked: false };
  }

  /**
   * Extend a lock's expiration
   */
  async extend(chainId: string, additionalMs?: number): Promise<boolean> {
    const lockFile = await this.readLockFile();
    const lock = lockFile.chains[chainId];

    if (!lock) {
      return false;
    }

    const extension = additionalMs || this.config.defaultExpirationMs;
    lock.expiresAt = new Date(Date.now() + extension);

    await this.writeLockFile(lockFile);
    return true;
  }

  /**
   * Format lock status for display
   */
  async formatStatus(): Promise<string> {
    const locks = await this.getAllLocks();
    const entries = Object.entries(locks);

    if (entries.length === 0) {
      return "No active locks";
    }

    const lines: string[] = ["Active locks:"];

    for (const [chainId, lock] of entries) {
      lines.push(`\n  ${chainId}:`);
      lines.push(`    Agent: ${lock.agent}`);
      lines.push(`    Acquired: ${lock.acquired.toISOString()}`);
      if (lock.expiresAt) {
        lines.push(`    Expires: ${lock.expiresAt.toISOString()}`);
      }
      lines.push(`    Files:`);
      for (const pattern of lock.files) {
        lines.push(`      - ${pattern}`);
      }
    }

    return lines.join("\n");
  }
}
