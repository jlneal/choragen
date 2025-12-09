/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify session state persistence for audit trail and crash recovery"
 * @test-type unit
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readFile, readdir, writeFile, utimes } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  Session,
  type SessionConfig,
  type SessionToolCall,
  type SessionError,
} from "../runtime/session.js";

describe("Session", () => {
  let testWorkspace: string;

  beforeEach(async () => {
    // Create a unique temp directory for each test
    testWorkspace = join(tmpdir(), `choragen-session-test-${Date.now()}`);
    await mkdir(testWorkspace, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directory
    await rm(testWorkspace, { recursive: true, force: true });
  });

  describe("constructor", () => {
    it("generates unique session ID", () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };

      const session1 = new Session(config);
      const session2 = new Session(config);

      expect(session1.id).not.toBe(session2.id);
    });

    it("generates session ID with correct format", () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };

      const session = new Session(config);

      // Format: session-YYYYMMDD-HHMMSS-xxxxxx
      expect(session.id).toMatch(/^session-\d{8}-\d{6}-[a-f0-9]{6}$/);
    });

    it("initializes with provided role and model", () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };

      const session = new Session(config);

      expect(session.role).toBe("control");
      expect(session.model).toBe("claude-sonnet-4-20250514");
    });

    it("initializes with optional chainId and taskId", () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        chainId: "CHAIN-037-agent-runtime-core",
        taskId: "007-session-state",
        workspaceRoot: testWorkspace,
      };

      const session = new Session(config);

      expect(session.chainId).toBe("CHAIN-037-agent-runtime-core");
      expect(session.taskId).toBe("007-session-state");
    });

    it("initializes chainId and taskId as null when not provided", () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };

      const session = new Session(config);

      expect(session.chainId).toBeNull();
      expect(session.taskId).toBeNull();
    });

    it("sets startTime to current ISO timestamp", () => {
      const before = new Date().toISOString();
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };

      const session = new Session(config);
      const after = new Date().toISOString();

      expect(session.startTime >= before).toBe(true);
      expect(session.startTime <= after).toBe(true);
    });

    it("initializes with null endTime and outcome", () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };

      const session = new Session(config);

      expect(session.endTime).toBeNull();
      expect(session.outcome).toBeNull();
    });

    it("initializes with zero token usage", () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };

      const session = new Session(config);

      expect(session.tokenUsage).toEqual({ input: 0, output: 0, total: 0 });
    });

    it("initializes with empty messages and toolCalls arrays", () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };

      const session = new Session(config);

      expect(session.messages).toEqual([]);
      expect(session.toolCalls).toEqual([]);
    });
  });

  describe("addMessage", () => {
    it("adds message to messages array", () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      session.addMessage({ role: "system", content: "You are a test agent." });
      session.addMessage({ role: "user", content: "Hello" });
      session.addMessage({ role: "assistant", content: "Hi there!" });

      expect(session.messages).toHaveLength(3);
      expect(session.messages[0]).toEqual({ role: "system", content: "You are a test agent." });
      expect(session.messages[1]).toEqual({ role: "user", content: "Hello" });
      expect(session.messages[2]).toEqual({ role: "assistant", content: "Hi there!" });
    });
  });

  describe("recordToolCall", () => {
    it("adds tool call to toolCalls array", async () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      const toolCall: SessionToolCall = {
        timestamp: new Date().toISOString(),
        name: "chain:status",
        params: { chainId: "CHAIN-037" },
        result: { success: true, data: { status: "active" } },
        governanceResult: { allowed: true },
      };

      await session.recordToolCall(toolCall);

      expect(session.toolCalls).toHaveLength(1);
      expect(session.toolCalls[0]).toEqual(toolCall);
    });

    it("auto-saves after recording tool call", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      const toolCall: SessionToolCall = {
        timestamp: new Date().toISOString(),
        name: "task:start",
        params: { chainId: "CHAIN-037", taskId: "007" },
        result: { success: true },
        governanceResult: { allowed: true },
      };

      await session.recordToolCall(toolCall);

      // Verify file was created
      const sessionsDir = join(testWorkspace, ".choragen/sessions");
      const files = await readdir(sessionsDir);
      expect(files).toHaveLength(1);
      expect(files[0]).toBe(`${session.id}.json`);
    });
  });

  describe("updateTokenUsage", () => {
    it("accumulates token usage", () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      session.updateTokenUsage(100, 50);
      expect(session.tokenUsage).toEqual({ input: 100, output: 50, total: 150 });

      session.updateTokenUsage(200, 75);
      expect(session.tokenUsage).toEqual({ input: 300, output: 125, total: 425 });
    });
  });

  describe("end", () => {
    it("sets endTime and outcome", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      const before = new Date().toISOString();
      await session.end("success");
      const after = new Date().toISOString();

      expect(session.outcome).toBe("success");
      expect(session.endTime).not.toBeNull();
      expect(session.endTime! >= before).toBe(true);
      expect(session.endTime! <= after).toBe(true);
    });

    it("saves session to disk", async () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      await session.end("failure");

      const filePath = join(testWorkspace, ".choragen/sessions", `${session.id}.json`);
      const content = await readFile(filePath, "utf-8");
      const data = JSON.parse(content);

      expect(data.outcome).toBe("failure");
      expect(data.endTime).not.toBeNull();
    });

    it("supports interrupted outcome", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      await session.end("interrupted");

      expect(session.outcome).toBe("interrupted");
    });
  });

  describe("save", () => {
    it("creates sessions directory if it does not exist", async () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      await session.save();

      const sessionsDir = join(testWorkspace, ".choragen/sessions");
      const files = await readdir(sessionsDir);
      expect(files).toContain(`${session.id}.json`);
    });

    it("writes human-readable JSON (pretty-printed)", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        chainId: "CHAIN-037",
        taskId: "007",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      await session.save();

      const filePath = join(testWorkspace, ".choragen/sessions", `${session.id}.json`);
      const content = await readFile(filePath, "utf-8");

      // Pretty-printed JSON has newlines
      expect(content).toContain("\n");
      // Verify it's valid JSON
      const data = JSON.parse(content);
      expect(data.id).toBe(session.id);
    });

    it("persists all session data", async () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        chainId: "CHAIN-037-agent-runtime-core",
        taskId: "007-session-state",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      session.addMessage({ role: "system", content: "Test prompt" });
      session.addMessage({ role: "user", content: "Hello" });
      session.updateTokenUsage(100, 50);

      await session.save();

      const filePath = join(testWorkspace, ".choragen/sessions", `${session.id}.json`);
      const content = await readFile(filePath, "utf-8");
      const data = JSON.parse(content);

      expect(data.id).toBe(session.id);
      expect(data.role).toBe("control");
      expect(data.model).toBe("claude-sonnet-4-20250514");
      expect(data.chainId).toBe("CHAIN-037-agent-runtime-core");
      expect(data.taskId).toBe("007-session-state");
      expect(data.startTime).toBe(session.startTime);
      expect(data.messages).toHaveLength(2);
      expect(data.tokenUsage).toEqual({ input: 100, output: 50, total: 150 });
    });
  });

  describe("load", () => {
    it("loads existing session from disk", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        chainId: "CHAIN-037",
        taskId: "007",
        workspaceRoot: testWorkspace,
      };
      const originalSession = new Session(config);
      originalSession.addMessage({ role: "system", content: "Test" });
      originalSession.updateTokenUsage(500, 200);
      await originalSession.end("success");

      const loadedSession = await Session.load(originalSession.id, testWorkspace);

      expect(loadedSession).not.toBeNull();
      expect(loadedSession!.id).toBe(originalSession.id);
      expect(loadedSession!.role).toBe("impl");
      expect(loadedSession!.model).toBe("claude-sonnet-4-20250514");
      expect(loadedSession!.chainId).toBe("CHAIN-037");
      expect(loadedSession!.taskId).toBe("007");
      expect(loadedSession!.outcome).toBe("success");
      expect(loadedSession!.messages).toHaveLength(1);
      expect(loadedSession!.tokenUsage).toEqual({ input: 500, output: 200, total: 700 });
    });

    it("returns null for non-existent session", async () => {
      const loadedSession = await Session.load("session-nonexistent", testWorkspace);

      expect(loadedSession).toBeNull();
    });

    it("loaded session can be modified and saved", async () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const originalSession = new Session(config);
      await originalSession.save();

      const loadedSession = await Session.load(originalSession.id, testWorkspace);
      expect(loadedSession).not.toBeNull();

      loadedSession!.addMessage({ role: "user", content: "New message" });
      await loadedSession!.save();

      // Load again to verify changes persisted
      const reloadedSession = await Session.load(originalSession.id, testWorkspace);
      expect(reloadedSession!.messages).toHaveLength(1);
      expect(reloadedSession!.messages[0].content).toBe("New message");
    });
  });

  describe("toJSON", () => {
    it("returns complete session data as plain object", () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        chainId: "CHAIN-037",
        taskId: "007",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      session.addMessage({ role: "system", content: "Test" });
      session.updateTokenUsage(100, 50);

      const json = session.toJSON();

      expect(json.id).toBe(session.id);
      expect(json.role).toBe("impl");
      expect(json.model).toBe("claude-sonnet-4-20250514");
      expect(json.chainId).toBe("CHAIN-037");
      expect(json.taskId).toBe("007");
      expect(json.startTime).toBe(session.startTime);
      expect(json.endTime).toBeNull();
      expect(json.outcome).toBeNull();
      expect(json.tokenUsage).toEqual({ input: 100, output: 50, total: 150 });
      expect(json.messages).toHaveLength(1);
      expect(json.toolCalls).toEqual([]);
    });

    it("returns defensive copies of arrays", () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      session.addMessage({ role: "user", content: "Test" });

      const json1 = session.toJSON();
      const json2 = session.toJSON();

      // Modifying one should not affect the other
      json1.messages.push({ role: "assistant", content: "Modified" });
      expect(json2.messages).toHaveLength(1);
      expect(session.messages).toHaveLength(1);
    });
  });

  describe("session file format", () => {
    it("matches expected JSON structure from task spec", async () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        chainId: "CHAIN-037-agent-runtime-core",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      session.addMessage({ role: "system", content: "You are a control agent." });
      session.addMessage({ role: "assistant", content: "Ready to work." });
      session.updateTokenUsage(12450, 3200);

      const toolCall: SessionToolCall = {
        timestamp: "2025-12-08T14:31:05.000Z",
        name: "chain:status",
        params: { chainId: "CHAIN-037" },
        result: { success: true, data: { status: "active" } },
        governanceResult: { allowed: true },
      };
      await session.recordToolCall(toolCall);
      await session.end("success");

      const filePath = join(testWorkspace, ".choragen/sessions", `${session.id}.json`);
      const content = await readFile(filePath, "utf-8");
      const data = JSON.parse(content);

      // Verify structure matches task spec
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("role", "control");
      expect(data).toHaveProperty("model", "claude-sonnet-4-20250514");
      expect(data).toHaveProperty("chainId", "CHAIN-037-agent-runtime-core");
      expect(data).toHaveProperty("taskId", null);
      expect(data).toHaveProperty("startTime");
      expect(data).toHaveProperty("endTime");
      expect(data).toHaveProperty("outcome", "success");
      expect(data).toHaveProperty("tokenUsage");
      expect(data.tokenUsage).toHaveProperty("input", 12450);
      expect(data.tokenUsage).toHaveProperty("output", 3200);
      expect(data.tokenUsage).toHaveProperty("total", 15650);
      expect(data).toHaveProperty("messages");
      expect(data.messages).toHaveLength(2);
      expect(data).toHaveProperty("toolCalls");
      expect(data.toolCalls).toHaveLength(1);
      expect(data.toolCalls[0]).toHaveProperty("timestamp");
      expect(data.toolCalls[0]).toHaveProperty("name", "chain:status");
      expect(data.toolCalls[0]).toHaveProperty("params");
      expect(data.toolCalls[0]).toHaveProperty("result");
      expect(data.toolCalls[0]).toHaveProperty("governanceResult");
    });
  });

  describe("nested session support", () => {
    it("creates root session with default nesting properties", () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };

      const session = new Session(config);

      expect(session.parentSessionId).toBeNull();
      expect(session.childSessionIds).toEqual([]);
      expect(session.nestingDepth).toBe(0);
      expect(session.isRootSession).toBe(true);
    });

    it("creates child session with parent reference", () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
        parentSessionId: "parent-session-001",
        nestingDepth: 1,
      };

      const session = new Session(config);

      expect(session.parentSessionId).toBe("parent-session-001");
      expect(session.nestingDepth).toBe(1);
      expect(session.isRootSession).toBe(false);
    });

    it("tracks child session IDs", async () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };

      const session = new Session(config);
      expect(session.childSessionIds).toEqual([]);

      await session.addChildSession("child-001");
      expect(session.childSessionIds).toEqual(["child-001"]);

      await session.addChildSession("child-002");
      expect(session.childSessionIds).toEqual(["child-001", "child-002"]);
    });

    it("persists nested session properties to JSON", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
        chainId: "CHAIN-001",
        taskId: "TASK-001",
        parentSessionId: "parent-session-001",
        nestingDepth: 1,
      };

      const session = new Session(config);
      await session.addChildSession("grandchild-001");
      await session.end("success");

      const filePath = join(testWorkspace, ".choragen/sessions", `${session.id}.json`);
      const content = await readFile(filePath, "utf-8");
      const data = JSON.parse(content);

      expect(data).toHaveProperty("parentSessionId", "parent-session-001");
      expect(data).toHaveProperty("childSessionIds", ["grandchild-001"]);
      expect(data).toHaveProperty("nestingDepth", 1);
    });

    it("toJSON includes nested session properties", () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
        parentSessionId: "parent-001",
        nestingDepth: 2,
      };

      const session = new Session(config);
      const json = session.toJSON();

      expect(json.parentSessionId).toBe("parent-001");
      expect(json.nestingDepth).toBe(2);
      expect(json.childSessionIds).toEqual([]);
    });
  });

  describe("session status and error tracking", () => {
    it("initializes with running status", () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };

      const session = new Session(config);

      expect(session.status).toBe("running");
      expect(session.error).toBeUndefined();
      expect(session.lastTurnIndex).toBe(0);
    });

    it("setStatus changes status and saves", async () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      await session.setStatus("paused");

      expect(session.status).toBe("paused");

      // Verify persisted
      const loaded = await Session.load(session.id, testWorkspace);
      expect(loaded!.status).toBe("paused");
    });

    it("setFailed sets status to failed with error details", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      const error: SessionError = {
        message: "API rate limit exceeded",
        stack: "Error: API rate limit exceeded\n    at ...",
        recoverable: true,
      };

      await session.setFailed(error);

      expect(session.status).toBe("failed");
      expect(session.error).toEqual(error);

      // Verify persisted
      const loaded = await Session.load(session.id, testWorkspace);
      expect(loaded!.status).toBe("failed");
      expect(loaded!.error).toEqual(error);
    });

    it("incrementTurnIndex increments and saves", async () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      expect(session.lastTurnIndex).toBe(0);

      await session.incrementTurnIndex();
      expect(session.lastTurnIndex).toBe(1);

      await session.incrementTurnIndex();
      expect(session.lastTurnIndex).toBe(2);

      // Verify persisted
      const loaded = await Session.load(session.id, testWorkspace);
      expect(loaded!.lastTurnIndex).toBe(2);
    });

    it("end with success sets status to completed", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      await session.end("success");

      expect(session.status).toBe("completed");
      expect(session.outcome).toBe("success");
    });

    it("end with failure sets status to failed", async () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      await session.end("failure");

      expect(session.status).toBe("failed");
      expect(session.outcome).toBe("failure");
    });

    it("end with interrupted sets status to failed", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      await session.end("interrupted");

      expect(session.status).toBe("failed");
      expect(session.outcome).toBe("interrupted");
    });

    it("error getter returns defensive copy", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      const error: SessionError = {
        message: "Test error",
        recoverable: false,
      };
      await session.setFailed(error);

      const error1 = session.error;
      const error2 = session.error;

      // Modifying one should not affect the other
      error1!.message = "Modified";
      expect(error2!.message).toBe("Test error");
    });
  });

  describe("listAll", () => {
    it("returns empty array when no sessions exist", async () => {
      const sessions = await Session.listAll(testWorkspace);

      expect(sessions).toEqual([]);
    });

    it("returns empty array when sessions directory does not exist", async () => {
      const nonExistentWorkspace = join(tmpdir(), `non-existent-${Date.now()}`);

      const sessions = await Session.listAll(nonExistentWorkspace);

      expect(sessions).toEqual([]);
    });

    it("lists all sessions with summary data", async () => {
      // Create multiple sessions
      const config1: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        chainId: "CHAIN-001",
        workspaceRoot: testWorkspace,
      };
      const session1 = new Session(config1);
      session1.updateTokenUsage(100, 50);
      await session1.save();

      const config2: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        chainId: "CHAIN-001",
        taskId: "TASK-001",
        workspaceRoot: testWorkspace,
      };
      const session2 = new Session(config2);
      session2.updateTokenUsage(200, 100);
      await session2.end("success");

      const sessions = await Session.listAll(testWorkspace);

      expect(sessions).toHaveLength(2);

      // Should be sorted by startTime descending (newest first)
      // session2 was created after session1
      const summaries = sessions.map((s) => s.id);
      expect(summaries).toContain(session1.id);
      expect(summaries).toContain(session2.id);

      // Check summary data
      const s1Summary = sessions.find((s) => s.id === session1.id)!;
      expect(s1Summary.role).toBe("control");
      expect(s1Summary.status).toBe("running");
      expect(s1Summary.chainId).toBe("CHAIN-001");
      expect(s1Summary.taskId).toBeNull();
      expect(s1Summary.tokenUsage).toEqual({ input: 100, output: 50, total: 150 });

      const s2Summary = sessions.find((s) => s.id === session2.id)!;
      expect(s2Summary.role).toBe("impl");
      expect(s2Summary.status).toBe("completed");
      expect(s2Summary.chainId).toBe("CHAIN-001");
      expect(s2Summary.taskId).toBe("TASK-001");
      expect(s2Summary.tokenUsage).toEqual({ input: 200, output: 100, total: 300 });
    });

    it("skips invalid session files", async () => {
      // Create a valid session
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      await session.save();

      // Create an invalid JSON file
      const sessionsDir = join(testWorkspace, ".choragen/sessions");
      await writeFile(join(sessionsDir, "invalid.json"), "not valid json", "utf-8");

      const sessions = await Session.listAll(testWorkspace);

      // Should only return the valid session
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe(session.id);
    });
  });

  describe("cleanup", () => {
    it("returns 0 when sessions directory does not exist", async () => {
      const nonExistentWorkspace = join(tmpdir(), `non-existent-${Date.now()}`);
      const DAYS_THRESHOLD = 7;

      const deleted = await Session.cleanup(nonExistentWorkspace, DAYS_THRESHOLD);

      expect(deleted).toBe(0);
    });

    it("returns 0 when no sessions are old enough", async () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      await session.save();
      const DAYS_THRESHOLD = 7;

      const deleted = await Session.cleanup(testWorkspace, DAYS_THRESHOLD);

      expect(deleted).toBe(0);

      // Session should still exist
      const sessions = await Session.listAll(testWorkspace);
      expect(sessions).toHaveLength(1);
    });

    it("deletes sessions older than specified days", async () => {
      // Create a session
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);
      await session.save();

      // Modify the file's mtime to be 10 days ago
      const sessionsDir = join(testWorkspace, ".choragen/sessions");
      const filePath = join(sessionsDir, `${session.id}.json`);
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      await utimes(filePath, tenDaysAgo, tenDaysAgo);
      const DAYS_THRESHOLD = 7;

      const deleted = await Session.cleanup(testWorkspace, DAYS_THRESHOLD);

      expect(deleted).toBe(1);

      // Session should no longer exist
      const sessions = await Session.listAll(testWorkspace);
      expect(sessions).toHaveLength(0);
    });

    it("only deletes sessions older than threshold", async () => {
      // Create two sessions
      const config1: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const oldSession = new Session(config1);
      await oldSession.save();

      const config2: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const newSession = new Session(config2);
      await newSession.save();

      // Make the first session old
      const sessionsDir = join(testWorkspace, ".choragen/sessions");
      const oldFilePath = join(sessionsDir, `${oldSession.id}.json`);
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      await utimes(oldFilePath, tenDaysAgo, tenDaysAgo);
      const DAYS_THRESHOLD = 7;

      const deleted = await Session.cleanup(testWorkspace, DAYS_THRESHOLD);

      expect(deleted).toBe(1);

      // Only new session should remain
      const sessions = await Session.listAll(testWorkspace);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe(newSession.id);
    });
  });

  describe("session data persistence for resume", () => {
    it("persists status, error, and lastTurnIndex to JSON", async () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        chainId: "CHAIN-040",
        taskId: "002",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      // Simulate a session that was running and then failed
      await session.incrementTurnIndex();
      await session.incrementTurnIndex();
      await session.setFailed({
        message: "Connection timeout",
        recoverable: true,
      });

      const filePath = join(testWorkspace, ".choragen/sessions", `${session.id}.json`);
      const content = await readFile(filePath, "utf-8");
      const data = JSON.parse(content);

      expect(data).toHaveProperty("status", "failed");
      expect(data).toHaveProperty("lastTurnIndex", 2);
      expect(data).toHaveProperty("error");
      expect(data.error).toEqual({
        message: "Connection timeout",
        recoverable: true,
      });
    });

    it("loaded session preserves all resume data", async () => {
      const config: SessionConfig = {
        role: "control",
        model: "claude-sonnet-4-20250514",
        chainId: "CHAIN-040",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      session.addMessage({ role: "system", content: "System prompt" });
      session.addMessage({ role: "user", content: "User message" });
      session.addMessage({ role: "assistant", content: "Assistant response" });
      await session.incrementTurnIndex();
      await session.setStatus("paused");

      const loaded = await Session.load(session.id, testWorkspace);

      expect(loaded).not.toBeNull();
      expect(loaded!.status).toBe("paused");
      expect(loaded!.lastTurnIndex).toBe(1);
      expect(loaded!.messages).toHaveLength(3);
      expect(loaded!.messages[0].content).toBe("System prompt");
      expect(loaded!.messages[1].content).toBe("User message");
      expect(loaded!.messages[2].content).toBe("Assistant response");
    });

    it("toJSON includes status, error, and lastTurnIndex", () => {
      const config: SessionConfig = {
        role: "impl",
        model: "claude-sonnet-4-20250514",
        workspaceRoot: testWorkspace,
      };
      const session = new Session(config);

      const json = session.toJSON();

      expect(json).toHaveProperty("status", "running");
      expect(json).toHaveProperty("lastTurnIndex", 0);
      expect(json.error).toBeUndefined();
    });
  });
});
