/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify session state persistence for audit trail and crash recovery"
 * @test-type unit
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  Session,
  type SessionConfig,
  type SessionToolCall,
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
});
