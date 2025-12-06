/**
 * Lock type definitions
 *
 * ADR: ADR-003-file-locking
 */

export interface FileLock {
  /** Glob patterns for locked files */
  files: string[];
  /** When the lock was acquired */
  acquired: Date;
  /** Identifier for the agent/session holding the lock */
  agent: string;
  /** Optional expiration */
  expiresAt?: Date;
}

export interface LockFile {
  /** Version for future compatibility */
  version: 1;
  /** Locks by chain ID */
  chains: Record<string, FileLock>;
}

export interface LockAcquisitionResult {
  success: boolean;
  /** The lock that was acquired (if successful) */
  lock?: FileLock;
  /** If failed, which chain holds conflicting locks */
  conflictingChain?: string;
  /** Which file patterns conflict */
  conflictingPatterns?: string[];
  /** Error message if failed */
  error?: string;
}

export interface LockConfig {
  /** Path to the lock file (default: ".choragen/locks.json") */
  lockFilePath: string;
  /** Default lock expiration in milliseconds (default: 24 hours) */
  defaultExpirationMs: number;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_LOCK_CONFIG: LockConfig = {
  lockFilePath: ".choragen/locks.json",
  defaultExpirationMs: ONE_DAY_MS,
};

export const EMPTY_LOCK_FILE: LockFile = {
  version: 1,
  chains: {},
};
