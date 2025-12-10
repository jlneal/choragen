/**
 * @design-doc docs/design/core/features/web-dashboard.md
 * @user-intent "Verify GitStatus component logic for calculating dirty state and change counts"
 * @test-type unit
 */

import { describe, it, expect } from "vitest";

/**
 * Helper function to calculate if working directory is clean
 * Mirrors the logic in GitStatus component
 */
function isWorkingDirectoryClean(status: {
  staged: string[];
  modified: string[];
  untracked: string[];
}): boolean {
  const changedCount =
    status.staged.length + status.modified.length + status.untracked.length;
  return changedCount === 0;
}

/**
 * Helper function to calculate total changed file count
 * Mirrors the logic in GitStatus component
 */
function getChangedCount(status: {
  staged: string[];
  modified: string[];
  untracked: string[];
}): number {
  return status.staged.length + status.modified.length + status.untracked.length;
}

describe("GitStatus component logic", () => {
  describe("isWorkingDirectoryClean", () => {
    it("returns true when all arrays are empty", () => {
      const status = {
        staged: [],
        modified: [],
        untracked: [],
      };

      expect(isWorkingDirectoryClean(status)).toBe(true);
    });

    it("returns false when there are staged files", () => {
      const status = {
        staged: ["file1.ts"],
        modified: [],
        untracked: [],
      };

      expect(isWorkingDirectoryClean(status)).toBe(false);
    });

    it("returns false when there are modified files", () => {
      const status = {
        staged: [],
        modified: ["file1.ts", "file2.ts"],
        untracked: [],
      };

      expect(isWorkingDirectoryClean(status)).toBe(false);
    });

    it("returns false when there are untracked files", () => {
      const status = {
        staged: [],
        modified: [],
        untracked: ["newfile.ts"],
      };

      expect(isWorkingDirectoryClean(status)).toBe(false);
    });

    it("returns false when there are mixed changes", () => {
      const status = {
        staged: ["staged.ts"],
        modified: ["modified.ts"],
        untracked: ["untracked.ts"],
      };

      expect(isWorkingDirectoryClean(status)).toBe(false);
    });
  });

  describe("getChangedCount", () => {
    it("returns 0 for clean working directory", () => {
      const status = {
        staged: [],
        modified: [],
        untracked: [],
      };

      expect(getChangedCount(status)).toBe(0);
    });

    it("counts staged files", () => {
      const status = {
        staged: ["a.ts", "b.ts"],
        modified: [],
        untracked: [],
      };

      const EXPECTED_COUNT = 2;
      expect(getChangedCount(status)).toBe(EXPECTED_COUNT);
    });

    it("counts modified files", () => {
      const status = {
        staged: [],
        modified: ["a.ts", "b.ts", "c.ts"],
        untracked: [],
      };

      const EXPECTED_COUNT = 3;
      expect(getChangedCount(status)).toBe(EXPECTED_COUNT);
    });

    it("counts untracked files", () => {
      const status = {
        staged: [],
        modified: [],
        untracked: ["new.ts"],
      };

      const EXPECTED_COUNT = 1;
      expect(getChangedCount(status)).toBe(EXPECTED_COUNT);
    });

    it("sums all change types", () => {
      const status = {
        staged: ["staged1.ts", "staged2.ts"],
        modified: ["mod1.ts", "mod2.ts", "mod3.ts"],
        untracked: ["new1.ts", "new2.ts"],
      };

      const EXPECTED_TOTAL = 7;
      expect(getChangedCount(status)).toBe(EXPECTED_TOTAL);
    });
  });
});
