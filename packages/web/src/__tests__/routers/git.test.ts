/**
 * @design-doc docs/design/core/features/web-dashboard.md
 * @user-intent "Verify git router correctly calls simple-git and returns expected data"
 * @test-type unit
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import { TRPCError } from "@trpc/server";

// Mock simple-git
const mockGit = {
  status: vi.fn(),
  add: vi.fn(),
  reset: vi.fn(),
  commit: vi.fn(),
  log: vi.fn(),
};

vi.mock("simple-git", () => ({
  default: vi.fn(() => mockGit),
}));

describe("git router", () => {
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({ projectRoot: "/tmp/test" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("status", () => {
    it("returns git status with branch, staged, modified, and untracked files", async () => {
      mockGit.status.mockResolvedValue({
        current: "main",
        staged: ["file1.ts"],
        renamed: [{ from: "old.ts", to: "new.ts" }],
        modified: ["file2.ts", "file3.ts"],
        not_added: ["untracked.ts"],
      });

      const result = await caller.git.status();

      expect(result).toEqual({
        branch: "main",
        staged: ["file1.ts", "new.ts"],
        modified: ["file2.ts", "file3.ts"],
        untracked: ["untracked.ts"],
      });
      expect(mockGit.status).toHaveBeenCalledOnce();
    });

    it("returns HEAD as branch when current is null", async () => {
      mockGit.status.mockResolvedValue({
        current: null,
        staged: [],
        renamed: [],
        modified: [],
        not_added: [],
      });

      const result = await caller.git.status();

      expect(result.branch).toBe("HEAD");
    });

    it("throws INTERNAL_SERVER_ERROR on git failure", async () => {
      mockGit.status.mockRejectedValue(new Error("Not a git repository"));

      await expect(caller.git.status()).rejects.toThrow(TRPCError);
      await expect(caller.git.status()).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });
    });
  });

  describe("stage", () => {
    it("stages files and returns success", async () => {
      mockGit.add.mockResolvedValue(undefined);

      const result = await caller.git.stage({ files: ["file1.ts", "file2.ts"] });

      expect(result).toEqual({
        success: true,
        files: ["file1.ts", "file2.ts"],
      });
      expect(mockGit.add).toHaveBeenCalledWith(["file1.ts", "file2.ts"]);
    });

    it("throws INTERNAL_SERVER_ERROR on git failure", async () => {
      mockGit.add.mockRejectedValue(new Error("File not found"));

      await expect(
        caller.git.stage({ files: ["nonexistent.ts"] })
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });
    });

    it("validates that at least one file is required", async () => {
      await expect(caller.git.stage({ files: [] })).rejects.toThrow();
    });
  });

  describe("unstage", () => {
    it("unstages files and returns success", async () => {
      mockGit.reset.mockResolvedValue(undefined);

      const result = await caller.git.unstage({ files: ["file1.ts"] });

      expect(result).toEqual({
        success: true,
        files: ["file1.ts"],
      });
      expect(mockGit.reset).toHaveBeenCalledWith(["HEAD", "--", "file1.ts"]);
    });

    it("throws INTERNAL_SERVER_ERROR on git failure", async () => {
      mockGit.reset.mockRejectedValue(new Error("Reset failed"));

      await expect(
        caller.git.unstage({ files: ["file.ts"] })
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });
    });
  });

  describe("commit", () => {
    it("commits with message and returns hash", async () => {
      mockGit.commit.mockResolvedValue({ commit: "abc123" });

      const result = await caller.git.commit({ message: "feat: add feature" });

      expect(result).toEqual({
        success: true,
        hash: "abc123",
      });
      expect(mockGit.commit).toHaveBeenCalledWith("feat: add feature");
    });

    it("appends request ID to commit message", async () => {
      mockGit.commit.mockResolvedValue({ commit: "def456" });

      await caller.git.commit({
        message: "feat: add feature",
        requestId: "CR-20251209-001",
      });

      expect(mockGit.commit).toHaveBeenCalledWith(
        "feat: add feature\n\n[CR-20251209-001]"
      );
    });

    it("does not duplicate request ID if already present", async () => {
      mockGit.commit.mockResolvedValue({ commit: "ghi789" });

      await caller.git.commit({
        message: "feat: add feature\n\n[CR-20251209-001]",
        requestId: "CR-20251209-001",
      });

      expect(mockGit.commit).toHaveBeenCalledWith(
        "feat: add feature\n\n[CR-20251209-001]"
      );
    });

    it("throws BAD_REQUEST when nothing to commit", async () => {
      mockGit.commit.mockResolvedValue({ commit: null });

      await expect(
        caller.git.commit({ message: "empty commit" })
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });

    it("throws INTERNAL_SERVER_ERROR on git failure", async () => {
      mockGit.commit.mockRejectedValue(new Error("Hook failed"));

      await expect(
        caller.git.commit({ message: "test" })
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });
    });
  });

  describe("log", () => {
    it("returns commit history", async () => {
      mockGit.log.mockResolvedValue({
        all: [
          {
            hash: "abc123",
            date: "2025-12-09T10:00:00Z",
            message: "feat: add feature",
            author_name: "Test User",
          },
          {
            hash: "def456",
            date: "2025-12-08T09:00:00Z",
            message: "fix: bug fix",
            author_name: "Test User",
          },
        ],
      });

      const result = await caller.git.log({ limit: 10 });

      expect(result).toEqual([
        {
          hash: "abc123",
          date: "2025-12-09T10:00:00Z",
          message: "feat: add feature",
          author: "Test User",
        },
        {
          hash: "def456",
          date: "2025-12-08T09:00:00Z",
          message: "fix: bug fix",
          author: "Test User",
        },
      ]);
      expect(mockGit.log).toHaveBeenCalledWith({ maxCount: 10 });
    });

    it("uses default limit of 10", async () => {
      mockGit.log.mockResolvedValue({ all: [] });

      await caller.git.log({});

      expect(mockGit.log).toHaveBeenCalledWith({ maxCount: 10 });
    });

    it("throws INTERNAL_SERVER_ERROR on git failure", async () => {
      mockGit.log.mockRejectedValue(new Error("Log failed"));

      await expect(caller.git.log({ limit: 5 })).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });
    });

    it("validates limit is positive and max 100", async () => {
      await expect(caller.git.log({ limit: 0 })).rejects.toThrow();
      await expect(caller.git.log({ limit: -1 })).rejects.toThrow();
      await expect(caller.git.log({ limit: 101 })).rejects.toThrow();
    });
  });
});
