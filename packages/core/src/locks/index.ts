/**
 * File locking and collision detection
 *
 * Advisory locks to prevent parallel chains from colliding.
 * Stored in .choragen/locks.json in consumer projects.
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
  chains: Record<string, FileLock>;
}

export interface LockAcquisitionResult {
  success: boolean;
  /** If failed, which chain holds conflicting locks */
  conflictingChain?: string;
  /** Which file patterns conflict */
  conflictingPatterns?: string[];
}

// Placeholder exports - implementation in Phase 2
export const LockManager = {
  // TODO: Implement in CR-20251205-005
};
