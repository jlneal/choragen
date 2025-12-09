/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify CLI commands for managing agent sessions: resume, list, and cleanup"
 * @test-type unit
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdir, rm, utimes } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  parseAgentResumeArgs,
  parseAgentListSessionsArgs,
  parseAgentCleanupArgs,
  runAgentResume,
  runAgentListSessions,
  runAgentCleanup,
  getAgentResumeHelp,
  getAgentListSessionsHelp,
  getAgentCleanupHelp,
} from "../commands/agent-session.js";
import { Session, type SessionConfig } from "../runtime/session.js";

describe("Agent Session Commands", () => {
  let testWorkspace: string;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    testWorkspace = join(tmpdir(), `choragen-agent-session-test-${Date.now()}`);
    await mkdir(testWorkspace, { recursive: true });

    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
  });

  afterEach(async () => {
    await rm(testWorkspace, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe("parseAgentResumeArgs", () => {
    it("parses session ID argument", () => {
      const result = parseAgentResumeArgs(["session-20251208-143022-abc123"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.options.sessionId).toBe("session-20251208-143022-abc123");
        expect(result.options.json).toBe(false);
      }
    });

    it("parses --json flag", () => {
      const result = parseAgentResumeArgs(["session-abc", "--json"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.options.json).toBe(true);
      }
    });

    it("returns error for missing session ID", () => {
      const result = parseAgentResumeArgs([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Missing required argument: <session-id>");
      }
    });

    it("returns SHOW_HELP for --help flag", () => {
      const result = parseAgentResumeArgs(["--help"]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("SHOW_HELP");
      }
    });

    it("returns error for unknown option", () => {
      const result = parseAgentResumeArgs(["session-abc", "--unknown"]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unknown option: --unknown");
      }
    });
  });

  describe("parseAgentListSessionsArgs", () => {
    it("parses with no arguments", () => {
      const result = parseAgentListSessionsArgs([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.options.json).toBe(false);
        expect(result.options.status).toBeUndefined();
        expect(result.options.limit).toBeUndefined();
      }
    });

    it("parses --json flag", () => {
      const result = parseAgentListSessionsArgs(["--json"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.options.json).toBe(true);
      }
    });

    it("parses --status with space separator", () => {
      const result = parseAgentListSessionsArgs(["--status", "running"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.options.status).toBe("running");
      }
    });

    it("parses --status with equals separator", () => {
      const result = parseAgentListSessionsArgs(["--status=completed"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.options.status).toBe("completed");
      }
    });

    it("returns error for invalid status", () => {
      const result = parseAgentListSessionsArgs(["--status=invalid"]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid status");
      }
    });

    it("parses --limit with space separator", () => {
      const result = parseAgentListSessionsArgs(["--limit", "10"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.options.limit).toBe(10);
      }
    });

    it("parses --limit with equals separator", () => {
      const result = parseAgentListSessionsArgs(["--limit=5"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.options.limit).toBe(5);
      }
    });

    it("returns error for invalid limit", () => {
      const result = parseAgentListSessionsArgs(["--limit=abc"]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid limit");
      }
    });

    it("returns error for zero limit", () => {
      const result = parseAgentListSessionsArgs(["--limit=0"]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid limit");
      }
    });
  });

  describe("parseAgentCleanupArgs", () => {
    it("parses with no arguments (defaults to 30 days)", () => {
      const result = parseAgentCleanupArgs([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.options.olderThanDays).toBe(30);
        expect(result.options.json).toBe(false);
        expect(result.options.dryRun).toBe(false);
      }
    });

    it("parses --older-than with space separator", () => {
      const result = parseAgentCleanupArgs(["--older-than", "7"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.options.olderThanDays).toBe(7);
      }
    });

    it("parses --older-than with equals separator", () => {
      const result = parseAgentCleanupArgs(["--older-than=14"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.options.olderThanDays).toBe(14);
      }
    });

    it("parses --dry-run flag", () => {
      const result = parseAgentCleanupArgs(["--dry-run"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.options.dryRun).toBe(true);
      }
    });

    it("parses --json flag", () => {
      const result = parseAgentCleanupArgs(["--json"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.options.json).toBe(true);
      }
    });

    it("parses multiple flags together", () => {
      const result = parseAgentCleanupArgs(["--older-than=7", "--dry-run", "--json"]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.options.olderThanDays).toBe(7);
        expect(result.options.dryRun).toBe(true);
        expect(result.options.json).toBe(true);
      }
    });

    it("returns error for invalid --older-than value", () => {
      const result = parseAgentCleanupArgs(["--older-than=abc"]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid --older-than value");
      }
    });

    it("returns error for zero --older-than value", () => {
      const result = parseAgentCleanupArgs(["--older-than=0"]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid --older-than value");
      }
    });
  });

  describe("runAgentResume", () => {
    it("shows help with --help flag", async () => {
      await runAgentResume(["--help"], testWorkspace);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain("agent:resume");
    });

    it("exits with error for non-existent session", async () => {
      await expect(
        runAgentResume(["session-nonexistent"], testWorkspace)
      ).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Session not found")
      );
    });

    it("exits with error for completed session", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      await session.end("success");

      await expect(
        runAgentResume([session.id], testWorkspace)
      ).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("already completed")
      );
    });

    it("exits with error for running session", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      await session.save();

      await expect(
        runAgentResume([session.id], testWorkspace)
      ).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("currently running")
      );
    });

    it("exits with error for non-recoverable failed session", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      await session.setFailed({
        message: "Fatal error",
        recoverable: false,
      });

      await expect(
        runAgentResume([session.id], testWorkspace)
      ).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("non-recoverable error")
      );
    });

    it("outputs session info for paused session", async () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        chainId: "CHAIN-040",
        taskId: "003",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      session.addMessage({ role: "system", content: "Test prompt" });
      session.updateTokenUsage(100, 50);
      await session.setStatus("paused");

      await runAgentResume([session.id], testWorkspace);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(session.id));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("control"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("paused"));
    });

    it("outputs JSON for paused session with --json flag", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      await session.setStatus("paused");

      await runAgentResume([session.id, "--json"], testWorkspace);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.success).toBe(true);
      expect(parsed.session.id).toBe(session.id);
      expect(parsed.session.status).toBe("paused");
    });

    it("allows resume for recoverable failed session", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      await session.setFailed({
        message: "Connection timeout",
        recoverable: true,
      });

      await runAgentResume([session.id], testWorkspace);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(session.id));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("failed"));
    });
  });

  describe("runAgentListSessions", () => {
    it("shows help with --help flag", async () => {
      await runAgentListSessions(["--help"], testWorkspace);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain("agent:list-sessions");
    });

    it("shows message when no sessions exist", async () => {
      await runAgentListSessions([], testWorkspace);

      expect(consoleLogSpy).toHaveBeenCalledWith("No sessions found.");
    });

    it("lists sessions in table format", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      session.updateTokenUsage(100, 50);
      await session.save();

      await runAgentListSessions([], testWorkspace);

      // Check header was printed
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("ID"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Role"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Status"));
      // Check session row was printed
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(session.id));
      // Check total was printed
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Total: 1 session"));
    });

    it("outputs JSON with --json flag", async () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      await session.save();

      await runAgentListSessions(["--json"], testWorkspace);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.sessions).toHaveLength(1);
      expect(parsed.sessions[0].id).toBe(session.id);
    });

    it("filters by status", async () => {
      // Create running session
      const config1: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const runningSession = new Session(config1);
      await runningSession.save();

      // Create completed session
      const config2: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const completedSession = new Session(config2);
      await completedSession.end("success");

      await runAgentListSessions(["--status=completed", "--json"], testWorkspace);

      const output = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.sessions).toHaveLength(1);
      expect(parsed.sessions[0].id).toBe(completedSession.id);
    });

    it("limits results with --limit", async () => {
      // Create multiple sessions
      for (let i = 0; i < 5; i++) {
        const config: SessionConfig = {
          role: "impl",
          model: "claude-sonnet-4-20250514",
          workspaceRoot: testWorkspace,
        };
        const session = new Session(config);
        await session.save();
      }

      await runAgentListSessions(["--limit=2", "--json"], testWorkspace);

      const output = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.sessions).toHaveLength(2);
    });
  });

  describe("runAgentCleanup", () => {
    it("shows help with --help flag", async () => {
      await runAgentCleanup(["--help"], testWorkspace);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain("agent:cleanup");
    });

    it("reports no sessions to delete when none exist", async () => {
      await runAgentCleanup([], testWorkspace);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No sessions older than 30 days found")
      );
    });

    it("reports no sessions to delete when all are recent", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      await session.save();

      await runAgentCleanup(["--older-than=7"], testWorkspace);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No sessions older than 7 days found")
      );

      // Session should still exist
      const sessions = await Session.listAll(testWorkspace);
      expect(sessions).toHaveLength(1);
    });

    it("deletes old sessions", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      await session.save();

      // Make session old
      const sessionsDir = join(testWorkspace, ".choragen/sessions");
      const filePath = join(sessionsDir, `${session.id}.json`);
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      await utimes(filePath, tenDaysAgo, tenDaysAgo);

      await runAgentCleanup(["--older-than=7"], testWorkspace);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Deleted 1 session")
      );

      // Session should be gone
      const sessions = await Session.listAll(testWorkspace);
      expect(sessions).toHaveLength(0);
    });

    it("outputs JSON with --json flag", async () => {
      await runAgentCleanup(["--json"], testWorkspace);

      const output = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.success).toBe(true);
      expect(parsed.deleted).toBe(0);
      expect(parsed.olderThanDays).toBe(30);
    });

    it("dry run shows what would be deleted without deleting", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      await session.save();

      // Make session old
      const sessionsDir = join(testWorkspace, ".choragen/sessions");
      const filePath = join(sessionsDir, `${session.id}.json`);
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      await utimes(filePath, tenDaysAgo, tenDaysAgo);

      await runAgentCleanup(["--older-than=7", "--dry-run"], testWorkspace);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Would delete 1 session")
      );

      // Session should still exist
      const sessions = await Session.listAll(testWorkspace);
      expect(sessions).toHaveLength(1);
    });

    it("dry run outputs JSON with --json flag", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      await session.save();

      // Make session old
      const sessionsDir = join(testWorkspace, ".choragen/sessions");
      const filePath = join(sessionsDir, `${session.id}.json`);
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      await utimes(filePath, tenDaysAgo, tenDaysAgo);

      await runAgentCleanup(["--older-than=7", "--dry-run", "--json"], testWorkspace);

      const output = consoleLogSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.dryRun).toBe(true);
      expect(parsed.wouldDelete).toBe(1);
      expect(parsed.sessions).toContain(session.id);
    });
  });

  describe("help text functions", () => {
    it("getAgentResumeHelp returns usage information", () => {
      const help = getAgentResumeHelp();

      expect(help).toContain("agent:resume");
      expect(help).toContain("<session-id>");
      expect(help).toContain("--json");
      expect(help).toContain("Examples");
    });

    it("getAgentListSessionsHelp returns usage information", () => {
      const help = getAgentListSessionsHelp();

      expect(help).toContain("agent:list-sessions");
      expect(help).toContain("--status");
      expect(help).toContain("--limit");
      expect(help).toContain("--json");
      expect(help).toContain("Examples");
    });

    it("getAgentCleanupHelp returns usage information", () => {
      const help = getAgentCleanupHelp();

      expect(help).toContain("agent:cleanup");
      expect(help).toContain("--older-than");
      expect(help).toContain("--dry-run");
      expect(help).toContain("--json");
      expect(help).toContain("Examples");
    });
  });
});
