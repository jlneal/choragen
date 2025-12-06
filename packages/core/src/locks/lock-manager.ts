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

/**
 * Check if two glob patterns could match the same file
 */
function patternsOverlap(pattern1: string, pattern2: string): boolean {
  // Simple heuristic: check if one pattern is a prefix of the other
  // or if they share a common directory prefix
  const parts1 = pattern1.split("/");
  const parts2 = pattern2.split("/");

  // Find common prefix length
  let commonPrefix = 0;
  for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
    if (parts1[i] === parts2[i]) {
      commonPrefix++;
    } else if (parts1[i].includes("*") || parts2[i].includes("*")) {
      // Wildcards could match
      return true;
    } else {
      break;
    }
  }

  // If one is a prefix of the other with wildcards, they overlap
  if (commonPrefix === parts1.length || commonPrefix === parts2.length) {
    return true;
  }

  // Check for ** which matches anything
  if (pattern1.includes("**") || pattern2.includes("**")) {
    // Check if the non-** parts could match
    const base1 = pattern1.split("**")[0];
    const base2 = pattern2.split("**")[0];
    if (base1.startsWith(base2) || base2.startsWith(base1)) {
      return true;
    }
  }

  return false;
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
