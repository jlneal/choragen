/**
 * @design-doc docs/design/core/features/task-chain-management.md
 * @test-type unit
 * @user-intent "Verify file scope overlap detection and chain conflict finding work correctly"
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import {
  getOverlappingPatterns,
  hasOverlap,
  findConflictingChains,
} from "../scope-utils.js";
import { ChainManager } from "../chain-manager.js";

describe("scope-utils", () => {
  describe("hasOverlap", () => {
    it("returns false for empty scopes", () => {
      expect(hasOverlap([], [])).toBe(false);
      expect(hasOverlap(["packages/**"], [])).toBe(false);
      expect(hasOverlap([], ["packages/**"])).toBe(false);
    });

    it("detects overlapping wildcard and concrete paths", () => {
      expect(
        hasOverlap(["packages/core/**"], ["packages/core/src/foo.ts"])
      ).toBe(true);
      expect(
        hasOverlap(["packages/core/src/foo.ts"], ["packages/core/**"])
      ).toBe(true);
    });

    it("returns false for disjoint patterns", () => {
      expect(
        hasOverlap(["packages/core/**"], ["apps/web/**"])
      ).toBe(false);
    });
  });

  describe("getOverlappingPatterns", () => {
    it("returns patterns participating in overlaps", () => {
      const overlaps = getOverlappingPatterns(
        ["packages/core/**", "apps/web/**"],
        ["packages/core/src/file.ts", "libs/shared/**"]
      );

      expect(overlaps).toEqual(
        expect.arrayContaining(["packages/core/**", "packages/core/src/file.ts"])
      );
      expect(overlaps).not.toContain("apps/web/**");
      expect(overlaps).not.toContain("libs/shared/**");
    });
  });

  describe("findConflictingChains", () => {
    let tempDir: string;
    let chainManager: ChainManager;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-scope-"));
      chainManager = new ChainManager(tempDir);
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it("returns chains whose scopes overlap with the target chain", async () => {
      const target = await chainManager.createChain({
        requestId: "CR-001",
        slug: "target",
        title: "Target Chain",
        fileScope: ["packages/core/**"],
      });

      const overlapping = await chainManager.createChain({
        requestId: "CR-001",
        slug: "overlap",
        title: "Overlap Chain",
        fileScope: ["packages/core/src/index.ts"],
      });

      const nonOverlapping = await chainManager.createChain({
        requestId: "CR-001",
        slug: "other",
        title: "Other Chain",
        fileScope: ["apps/web/**"],
      });

      const conflicts = await findConflictingChains(target.id, tempDir);
      const conflictIds = conflicts.map((c) => c.id);

      expect(conflictIds).toContain(overlapping.id);
      expect(conflictIds).not.toContain(nonOverlapping.id);
    });

    it("returns empty when target has no scope or does not exist", async () => {
      const target = await chainManager.createChain({
        requestId: "CR-001",
        slug: "no-scope",
        title: "No Scope Chain",
      });

      expect(await findConflictingChains(target.id, tempDir)).toEqual([]);
      expect(await findConflictingChains("CHAIN-999-missing", tempDir)).toEqual(
        []
      );
    });
  });
});
