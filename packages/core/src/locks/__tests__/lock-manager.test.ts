/**
 * @design-doc docs/design/core/features/file-locking.md
 * @user-intent "Verify LockManager correctly acquires, releases, and checks file pattern locks for parallel chain coordination"
 * @test-type unit
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { LockManager } from "../lock-manager.js";
import type { LockFile } from "../types.js";

describe("LockManager", () => {
  let tempDir: string;
  let lockManager: LockManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-lock-test-"));
    lockManager = new LockManager(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("acquire", () => {
    it("acquires a lock for a chain", async () => {
      const result = await lockManager.acquire(
        "CHAIN-001-test",
        ["src/**/*.ts"],
        "agent-1"
      );

      expect(result.success).toBe(true);
      expect(result.lock).toBeDefined();
      expect(result.lock!.files).toEqual(["src/**/*.ts"]);
      expect(result.lock!.agent).toBe("agent-1");
      expect(result.lock!.acquired).toBeInstanceOf(Date);
      expect(result.lock!.expiresAt).toBeInstanceOf(Date);
    });

    it("acquires locks for multiple file patterns", async () => {
      const result = await lockManager.acquire(
        "CHAIN-001-test",
        ["src/**/*.ts", "lib/**/*.js", "tests/**/*"],
        "agent-1"
      );

      expect(result.success).toBe(true);
      expect(result.lock!.files).toHaveLength(3);
      expect(result.lock!.files).toContain("src/**/*.ts");
      expect(result.lock!.files).toContain("lib/**/*.js");
      expect(result.lock!.files).toContain("tests/**/*");
    });

    it("allows same chain to re-acquire locks", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      const result = await lockManager.acquire(
        "CHAIN-001-test",
        ["src/**/*.ts", "lib/**/*.js"],
        "agent-1"
      );

      expect(result.success).toBe(true);
      expect(result.lock!.files).toEqual(["src/**/*.ts", "lib/**/*.js"]);
    });

    it("sets expiration time on acquired lock", async () => {
      const beforeAcquire = Date.now();
      const result = await lockManager.acquire(
        "CHAIN-001-test",
        ["src/**/*.ts"],
        "agent-1"
      );
      const afterAcquire = Date.now();

      expect(result.lock!.expiresAt).toBeDefined();
      const expiresAt = result.lock!.expiresAt!.getTime();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;

      // Expiration should be ~24 hours from now
      expect(expiresAt).toBeGreaterThanOrEqual(beforeAcquire + ONE_DAY_MS);
      expect(expiresAt).toBeLessThanOrEqual(afterAcquire + ONE_DAY_MS + 1000);
    });
  });

  describe("release", () => {
    it("releases an existing lock", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      const released = await lockManager.release("CHAIN-001-test");
      expect(released).toBe(true);

      const lock = await lockManager.getLock("CHAIN-001-test");
      expect(lock).toBeNull();
    });

    it("returns false when releasing non-existent lock", async () => {
      const released = await lockManager.release("CHAIN-999-nonexistent");
      expect(released).toBe(false);
    });

    it("removes lock from lock file", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");
      await lockManager.release("CHAIN-001-test");

      const lockFilePath = path.join(tempDir, ".choragen/locks.json");
      const content = await fs.readFile(lockFilePath, "utf-8");
      const lockFile = JSON.parse(content) as LockFile;

      expect(lockFile.chains["CHAIN-001-test"]).toBeUndefined();
    });
  });

  describe("getLock", () => {
    it("returns null for non-existent lock", async () => {
      const lock = await lockManager.getLock("CHAIN-999-nonexistent");
      expect(lock).toBeNull();
    });

    it("returns lock for existing chain", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      const lock = await lockManager.getLock("CHAIN-001-test");
      expect(lock).not.toBeNull();
      expect(lock!.files).toEqual(["src/**/*.ts"]);
      expect(lock!.agent).toBe("agent-1");
    });

    it("cleans expired locks when getting", async () => {
      // Create a lock manager with short expiration
      const SHORT_EXPIRATION_MS = 100;
      const shortExpiryManager = new LockManager(tempDir, {
        defaultExpirationMs: SHORT_EXPIRATION_MS,
      });

      await shortExpiryManager.acquire(
        "CHAIN-001-test",
        ["src/**/*.ts"],
        "agent-1"
      );

      // Wait for expiration
      await new Promise((resolve) =>
        setTimeout(resolve, SHORT_EXPIRATION_MS + 50)
      );

      const lock = await shortExpiryManager.getLock("CHAIN-001-test");
      expect(lock).toBeNull();
    });
  });

  describe("getAllLocks", () => {
    it("returns empty object when no locks exist", async () => {
      const locks = await lockManager.getAllLocks();
      expect(locks).toEqual({});
    });

    it("returns all active locks", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");
      await lockManager.acquire("CHAIN-002-other", ["lib/**/*.js"], "agent-2");

      const locks = await lockManager.getAllLocks();
      expect(Object.keys(locks)).toHaveLength(2);
      expect(locks["CHAIN-001-test"]).toBeDefined();
      expect(locks["CHAIN-002-other"]).toBeDefined();
    });
  });

  describe("isFileLocked", () => {
    it("returns false for unlocked file", async () => {
      const result = await lockManager.isFileLocked("src/index.ts");
      expect(result.locked).toBe(false);
      expect(result.chainId).toBeUndefined();
    });

    it("returns true for file matching locked pattern", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      const result = await lockManager.isFileLocked("src/index.ts");
      expect(result.locked).toBe(true);
      expect(result.chainId).toBe("CHAIN-001-test");
    });

    it("returns false for file not matching locked pattern", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      const result = await lockManager.isFileLocked("lib/utils.js");
      expect(result.locked).toBe(false);
    });

    it("matches nested file paths", async () => {
      await lockManager.acquire(
        "CHAIN-001-test",
        ["packages/core/**/*.ts"],
        "agent-1"
      );

      const result = await lockManager.isFileLocked(
        "packages/core/src/locks/lock-manager.ts"
      );
      expect(result.locked).toBe(true);
      expect(result.chainId).toBe("CHAIN-001-test");
    });

    it("identifies which chain holds the lock", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");
      await lockManager.acquire("CHAIN-002-other", ["lib/**/*.js"], "agent-2");

      const srcResult = await lockManager.isFileLocked("src/index.ts");
      expect(srcResult.chainId).toBe("CHAIN-001-test");

      const libResult = await lockManager.isFileLocked("lib/utils.js");
      expect(libResult.chainId).toBe("CHAIN-002-other");
    });
  });

  describe("lock conflicts", () => {
    it("detects conflict with exact same pattern", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      const result = await lockManager.acquire(
        "CHAIN-002-other",
        ["src/**/*.ts"],
        "agent-2"
      );

      expect(result.success).toBe(false);
      expect(result.conflictingChain).toBe("CHAIN-001-test");
      expect(result.conflictingPatterns).toContain("src/**/*.ts");
      expect(result.error).toContain("Lock conflict");
    });

    it("detects conflict with overlapping patterns", async () => {
      await lockManager.acquire(
        "CHAIN-001-test",
        ["packages/core/**/*.ts"],
        "agent-1"
      );

      const result = await lockManager.acquire(
        "CHAIN-002-other",
        ["packages/**/*.ts"],
        "agent-2"
      );

      expect(result.success).toBe(false);
      expect(result.conflictingChain).toBe("CHAIN-001-test");
    });

    it("detects conflict when new pattern is subset of existing", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*"], "agent-1");

      const result = await lockManager.acquire(
        "CHAIN-002-other",
        ["src/utils/**/*.ts"],
        "agent-2"
      );

      expect(result.success).toBe(false);
      expect(result.conflictingChain).toBe("CHAIN-001-test");
    });

    it("allows non-overlapping patterns from different chains", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      const result = await lockManager.acquire(
        "CHAIN-002-other",
        ["docs/**/*.md"],
        "agent-2"
      );

      expect(result.success).toBe(true);
    });

    it("includes error message with conflict details", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      const result = await lockManager.acquire(
        "CHAIN-002-other",
        ["src/**/*.ts"],
        "agent-2"
      );

      expect(result.error).toContain("src/**/*.ts");
      expect(result.error).toContain("CHAIN-001-test");
    });
  });

  describe("lock file persistence", () => {
    it("creates lock file on first acquire", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      const lockFilePath = path.join(tempDir, ".choragen/locks.json");
      const stat = await fs.stat(lockFilePath);
      expect(stat.isFile()).toBe(true);
    });

    it("creates .choragen directory if not exists", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      const choragenDir = path.join(tempDir, ".choragen");
      const stat = await fs.stat(choragenDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it("persists lock data in JSON format", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      const lockFilePath = path.join(tempDir, ".choragen/locks.json");
      const content = await fs.readFile(lockFilePath, "utf-8");
      const lockFile = JSON.parse(content) as LockFile;

      expect(lockFile.version).toBe(1);
      expect(lockFile.chains["CHAIN-001-test"]).toBeDefined();
      expect(lockFile.chains["CHAIN-001-test"].files).toEqual(["src/**/*.ts"]);
    });

    it("survives manager recreation", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      // Create new manager instance
      const newManager = new LockManager(tempDir);
      const lock = await newManager.getLock("CHAIN-001-test");

      expect(lock).not.toBeNull();
      expect(lock!.files).toEqual(["src/**/*.ts"]);
      expect(lock!.agent).toBe("agent-1");
    });

    it("handles missing lock file gracefully", async () => {
      const lock = await lockManager.getLock("CHAIN-001-test");
      expect(lock).toBeNull();
    });
  });

  describe("extend", () => {
    it("extends lock expiration", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      const beforeExtend = Date.now();
      const extended = await lockManager.extend("CHAIN-001-test");
      expect(extended).toBe(true);

      const lock = await lockManager.getLock("CHAIN-001-test");
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      expect(lock!.expiresAt!.getTime()).toBeGreaterThanOrEqual(
        beforeExtend + ONE_DAY_MS
      );
    });

    it("extends lock with custom duration", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      const CUSTOM_EXTENSION_MS = 2 * 60 * 60 * 1000; // 2 hours
      const beforeExtend = Date.now();
      const extended = await lockManager.extend(
        "CHAIN-001-test",
        CUSTOM_EXTENSION_MS
      );
      expect(extended).toBe(true);

      const lock = await lockManager.getLock("CHAIN-001-test");
      expect(lock!.expiresAt!.getTime()).toBeGreaterThanOrEqual(
        beforeExtend + CUSTOM_EXTENSION_MS
      );
      expect(lock!.expiresAt!.getTime()).toBeLessThanOrEqual(
        beforeExtend + CUSTOM_EXTENSION_MS + 1000
      );
    });

    it("returns false for non-existent lock", async () => {
      const extended = await lockManager.extend("CHAIN-999-nonexistent");
      expect(extended).toBe(false);
    });
  });

  describe("formatStatus", () => {
    it("returns message when no locks exist", async () => {
      const status = await lockManager.formatStatus();
      expect(status).toBe("No active locks");
    });

    it("formats single lock status", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      const status = await lockManager.formatStatus();
      expect(status).toContain("Active locks:");
      expect(status).toContain("CHAIN-001-test");
      expect(status).toContain("agent-1");
      expect(status).toContain("src/**/*.ts");
    });

    it("formats multiple locks status", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");
      await lockManager.acquire("CHAIN-002-other", ["lib/**/*.js"], "agent-2");

      const status = await lockManager.formatStatus();
      expect(status).toContain("CHAIN-001-test");
      expect(status).toContain("CHAIN-002-other");
      expect(status).toContain("agent-1");
      expect(status).toContain("agent-2");
    });

    it("includes expiration time in status", async () => {
      await lockManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      const status = await lockManager.formatStatus();
      expect(status).toContain("Expires:");
    });
  });

  describe("custom configuration", () => {
    it("uses custom lock file path", async () => {
      const customManager = new LockManager(tempDir, {
        lockFilePath: "custom/locks.json",
      });

      await customManager.acquire("CHAIN-001-test", ["src/**/*.ts"], "agent-1");

      const customLockPath = path.join(tempDir, "custom/locks.json");
      const stat = await fs.stat(customLockPath);
      expect(stat.isFile()).toBe(true);
    });

    it("uses custom expiration time", async () => {
      const CUSTOM_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour
      const customManager = new LockManager(tempDir, {
        defaultExpirationMs: CUSTOM_EXPIRATION_MS,
      });

      const beforeAcquire = Date.now();
      const result = await customManager.acquire(
        "CHAIN-001-test",
        ["src/**/*.ts"],
        "agent-1"
      );

      const expiresAt = result.lock!.expiresAt!.getTime();
      expect(expiresAt).toBeGreaterThanOrEqual(
        beforeAcquire + CUSTOM_EXPIRATION_MS
      );
      expect(expiresAt).toBeLessThanOrEqual(
        beforeAcquire + CUSTOM_EXPIRATION_MS + 1000
      );
    });
  });

  describe("error cases", () => {
    it("handles empty file pattern array", async () => {
      const result = await lockManager.acquire("CHAIN-001-test", [], "agent-1");

      expect(result.success).toBe(true);
      expect(result.lock!.files).toEqual([]);
    });

    it("handles special characters in chain ID", async () => {
      const result = await lockManager.acquire(
        "CHAIN-001-special_chars-test",
        ["src/**/*.ts"],
        "agent-1"
      );

      expect(result.success).toBe(true);

      const lock = await lockManager.getLock("CHAIN-001-special_chars-test");
      expect(lock).not.toBeNull();
    });

    it("handles special characters in file patterns", async () => {
      const result = await lockManager.acquire(
        "CHAIN-001-test",
        ["src/[utils]/**/*.ts", "lib/(helpers)/**/*"],
        "agent-1"
      );

      expect(result.success).toBe(true);
      expect(result.lock!.files).toContain("src/[utils]/**/*.ts");
    });
  });
});
