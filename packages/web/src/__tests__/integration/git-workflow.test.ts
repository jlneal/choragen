/**
 * @design-doc docs/design/core/features/web-dashboard.md
 * @user-intent "Verify end-to-end git workflow: status → stage → commit → log"
 * @test-type integration
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers";

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

describe("git workflow integration", () => {
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({ projectRoot: "/tmp/test" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("full commit workflow", () => {
    it("completes status → stage → commit → log workflow", async () => {
      // Step 1: Get initial status with modified files
      mockGit.status.mockResolvedValueOnce({
        current: "feature/git-integration",
        staged: [],
        renamed: [],
        modified: ["src/components/git/git-panel.tsx", "src/app/page.tsx"],
        not_added: ["src/components/git/git-section.tsx"],
      });

      const initialStatus = await caller.git.status();

      expect(initialStatus.branch).toBe("feature/git-integration");
      expect(initialStatus.staged).toHaveLength(0);
      const EXPECTED_MODIFIED_COUNT = 2;
      expect(initialStatus.modified).toHaveLength(EXPECTED_MODIFIED_COUNT);
      const EXPECTED_UNTRACKED_COUNT = 1;
      expect(initialStatus.untracked).toHaveLength(EXPECTED_UNTRACKED_COUNT);

      // Step 2: Stage all files
      mockGit.add.mockResolvedValue(undefined);

      const filesToStage = [...initialStatus.modified, ...initialStatus.untracked];
      const stageResult = await caller.git.stage({ files: filesToStage });

      expect(stageResult.success).toBe(true);
      const EXPECTED_STAGED_COUNT = 3;
      expect(stageResult.files).toHaveLength(EXPECTED_STAGED_COUNT);
      expect(mockGit.add).toHaveBeenCalledWith(filesToStage);

      // Step 3: Verify status shows files as staged
      mockGit.status.mockResolvedValueOnce({
        current: "feature/git-integration",
        staged: [
          "src/components/git/git-panel.tsx",
          "src/app/page.tsx",
          "src/components/git/git-section.tsx",
        ],
        renamed: [],
        modified: [],
        not_added: [],
      });

      const stagedStatus = await caller.git.status();

      expect(stagedStatus.staged).toHaveLength(EXPECTED_STAGED_COUNT);
      expect(stagedStatus.modified).toHaveLength(0);
      expect(stagedStatus.untracked).toHaveLength(0);

      // Step 4: Commit with CR reference
      mockGit.commit.mockResolvedValue({ commit: "abc123def456" });

      const commitResult = await caller.git.commit({
        message: "feat(git): integrate git components into dashboard",
        requestId: "CR-20251209-022",
      });

      expect(commitResult.success).toBe(true);
      expect(commitResult.hash).toBe("abc123def456");
      expect(mockGit.commit).toHaveBeenCalledWith(
        "feat(git): integrate git components into dashboard\n\n[CR-20251209-022]"
      );

      // Step 5: Verify commit appears in log
      mockGit.log.mockResolvedValue({
        all: [
          {
            hash: "abc123def456",
            date: "2025-12-10T14:00:00Z",
            message: "feat(git): integrate git components into dashboard\n\n[CR-20251209-022]",
            author_name: "Test User",
          },
          {
            hash: "previous123",
            date: "2025-12-09T10:00:00Z",
            message: "feat(git): add commit dialog",
            author_name: "Test User",
          },
        ],
      });

      const HISTORY_LIMIT = 10;
      const logResult = await caller.git.log({ limit: HISTORY_LIMIT });

      const EXPECTED_LOG_COUNT = 2;
      expect(logResult).toHaveLength(EXPECTED_LOG_COUNT);
      expect(logResult[0].hash).toBe("abc123def456");
      expect(logResult[0].message).toContain("CR-20251209-022");
    });

    it("handles stage → unstage → stage workflow", async () => {
      // Stage files
      mockGit.add.mockResolvedValue(undefined);
      await caller.git.stage({ files: ["file1.ts", "file2.ts"] });

      expect(mockGit.add).toHaveBeenCalledWith(["file1.ts", "file2.ts"]);

      // Unstage one file
      mockGit.reset.mockResolvedValue(undefined);
      await caller.git.unstage({ files: ["file2.ts"] });

      expect(mockGit.reset).toHaveBeenCalledWith(["HEAD", "--", "file2.ts"]);

      // Re-stage the file
      mockGit.add.mockResolvedValue(undefined);
      await caller.git.stage({ files: ["file2.ts"] });

      const EXPECTED_ADD_CALLS = 2;
      expect(mockGit.add).toHaveBeenCalledTimes(EXPECTED_ADD_CALLS);
    });

    it("handles commit rejection by hooks", async () => {
      // Stage files
      mockGit.add.mockResolvedValue(undefined);
      await caller.git.stage({ files: ["test.ts"] });

      // Commit fails due to hook
      mockGit.commit.mockResolvedValue({ commit: null });

      await expect(
        caller.git.commit({ message: "test: failing commit" })
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("rejected by hooks"),
      });
    });
  });

  describe("error recovery", () => {
    it("allows retry after failed stage operation", async () => {
      // First attempt fails
      mockGit.add.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        caller.git.stage({ files: ["file.ts"] })
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });

      // Retry succeeds
      mockGit.add.mockResolvedValue(undefined);

      const result = await caller.git.stage({ files: ["file.ts"] });

      expect(result.success).toBe(true);
    });

    it("maintains consistent state after partial operations", async () => {
      // Stage some files
      mockGit.add.mockResolvedValue(undefined);
      await caller.git.stage({ files: ["file1.ts"] });

      // Status reflects staged file
      mockGit.status.mockResolvedValue({
        current: "main",
        staged: ["file1.ts"],
        renamed: [],
        modified: ["file2.ts"],
        not_added: [],
      });

      const status = await caller.git.status();

      expect(status.staged).toContain("file1.ts");
      expect(status.modified).toContain("file2.ts");
    });
  });

  describe("commit message formatting", () => {
    it("formats commit message with type, scope, and description", async () => {
      mockGit.commit.mockResolvedValue({ commit: "test123" });

      await caller.git.commit({
        message: "feat(dashboard): add git section to main page",
      });

      expect(mockGit.commit).toHaveBeenCalledWith(
        "feat(dashboard): add git section to main page"
      );
    });

    it("appends FR reference correctly", async () => {
      mockGit.commit.mockResolvedValue({ commit: "fix123" });

      await caller.git.commit({
        message: "fix(git): resolve staging issue",
        requestId: "FR-20251210-001",
      });

      expect(mockGit.commit).toHaveBeenCalledWith(
        "fix(git): resolve staging issue\n\n[FR-20251210-001]"
      );
    });

    it("handles multi-line commit messages", async () => {
      mockGit.commit.mockResolvedValue({ commit: "multi123" });

      await caller.git.commit({
        message: "feat(git): add comprehensive git integration\n\nThis includes:\n- GitPanel\n- CommitDialog\n- CommitHistory",
        requestId: "CR-20251209-022",
      });

      expect(mockGit.commit).toHaveBeenCalledWith(
        "feat(git): add comprehensive git integration\n\nThis includes:\n- GitPanel\n- CommitDialog\n- CommitHistory\n\n[CR-20251209-022]"
      );
    });
  });
});
