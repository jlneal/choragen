/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify menu utility functions for session counting"
 * @test-type unit
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { countPausedSessions, getSessionCounts } from "../../menu/utils.js";
import { Session } from "../../runtime/index.js";

// Mock the Session module
vi.mock("../../runtime/index.js", () => ({
  Session: {
    listAll: vi.fn(),
  },
}));

describe("Menu Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("countPausedSessions", () => {
    it("returns 0 when no sessions exist", async () => {
      vi.mocked(Session.listAll).mockResolvedValue([]);

      const count = await countPausedSessions("/test/workspace");

      expect(count).toBe(0);
    });

    it("counts only paused sessions", async () => {
      vi.mocked(Session.listAll).mockResolvedValue([
        { id: "s1", status: "paused", role: "impl", startTime: "", endTime: null, chainId: null, taskId: null, tokenUsage: { input: 0, output: 0, total: 0 } },
        { id: "s2", status: "running", role: "impl", startTime: "", endTime: null, chainId: null, taskId: null, tokenUsage: { input: 0, output: 0, total: 0 } },
        { id: "s3", status: "paused", role: "control", startTime: "", endTime: null, chainId: null, taskId: null, tokenUsage: { input: 0, output: 0, total: 0 } },
        { id: "s4", status: "completed", role: "impl", startTime: "", endTime: null, chainId: null, taskId: null, tokenUsage: { input: 0, output: 0, total: 0 } },
      ]);

      const count = await countPausedSessions("/test/workspace");

      const EXPECTED_PAUSED_COUNT = 2;
      expect(count).toBe(EXPECTED_PAUSED_COUNT);
    });

    it("returns 0 when Session.listAll throws", async () => {
      vi.mocked(Session.listAll).mockRejectedValue(new Error("Test error"));

      const count = await countPausedSessions("/test/workspace");

      expect(count).toBe(0);
    });
  });

  describe("getSessionCounts", () => {
    it("returns zero counts when no sessions exist", async () => {
      vi.mocked(Session.listAll).mockResolvedValue([]);

      const counts = await getSessionCounts("/test/workspace");

      expect(counts).toEqual({
        running: 0,
        paused: 0,
        completed: 0,
        failed: 0,
        total: 0,
      });
    });

    it("counts sessions by status", async () => {
      vi.mocked(Session.listAll).mockResolvedValue([
        { id: "s1", status: "running", role: "impl", startTime: "", endTime: null, chainId: null, taskId: null, tokenUsage: { input: 0, output: 0, total: 0 } },
        { id: "s2", status: "paused", role: "impl", startTime: "", endTime: null, chainId: null, taskId: null, tokenUsage: { input: 0, output: 0, total: 0 } },
        { id: "s3", status: "paused", role: "control", startTime: "", endTime: null, chainId: null, taskId: null, tokenUsage: { input: 0, output: 0, total: 0 } },
        { id: "s4", status: "completed", role: "impl", startTime: "", endTime: null, chainId: null, taskId: null, tokenUsage: { input: 0, output: 0, total: 0 } },
        { id: "s5", status: "failed", role: "impl", startTime: "", endTime: null, chainId: null, taskId: null, tokenUsage: { input: 0, output: 0, total: 0 } },
      ]);

      const counts = await getSessionCounts("/test/workspace");

      expect(counts).toEqual({
        running: 1,
        paused: 2,
        completed: 1,
        failed: 1,
        total: 5,
      });
    });

    it("returns zero counts when Session.listAll throws", async () => {
      vi.mocked(Session.listAll).mockRejectedValue(new Error("Test error"));

      const counts = await getSessionCounts("/test/workspace");

      expect(counts).toEqual({
        running: 0,
        paused: 0,
        completed: 0,
        failed: 0,
        total: 0,
      });
    });
  });
});
