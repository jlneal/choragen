/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "End-to-end integration tests for the complete agent runtime"
 * @test-type integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  runAgentSession,
  type LLMProvider,
  type ChatResponse,
  type Message,
  type Tool,
  ToolRegistry,
  ToolExecutor,
  GovernanceGate,
  PromptLoader,
  Session,
  type ToolDefinition,
  type ToolExecutorFn,
} from "../index.js";
import type { RoleManager } from "@choragen/core";

/**
 * Mock LLM provider that returns pre-configured responses.
 * Allows deterministic testing of the agent runtime.
 */
class MockLLMProvider implements LLMProvider {
  readonly name = "anthropic" as const;
  readonly model = "mock-model";

  private responses: ChatResponse[];
  private callIndex = 0;
  private _chatCalls: Array<{ messages: Message[]; tools: Tool[] }> = [];

  constructor(responses: ChatResponse[]) {
    this.responses = responses;
  }

  async chat(messages: Message[], tools: Tool[]): Promise<ChatResponse> {
    this._chatCalls.push({ messages, tools });

    if (this.callIndex >= this.responses.length) {
      throw new Error("No more mock responses available");
    }
    return this.responses[this.callIndex++];
  }

  /** Get all chat calls made to this provider */
  get chatCalls(): Array<{ messages: Message[]; tools: Tool[] }> {
    return this._chatCalls;
  }
}

/**
 * Create a mock prompt loader that returns a simple prompt.
 */
function createMockPromptLoader(): PromptLoader {
  const loader = new PromptLoader("/test/workspace");
  vi.spyOn(loader, "load").mockResolvedValue("You are a test agent.");
  return loader;
}

/**
 * Tool definitions for integration testing.
 * Includes tools with different role permissions.
 */
const integrationTestTools: ToolDefinition[] = [
  {
    name: "chain:status",
    description: "Get chain status (available to both roles)",
    parameters: {
      type: "object",
      properties: {
        chainId: { type: "string", description: "Chain ID" },
      },
      required: ["chainId"],
    },
    category: "chain",
    mutates: false,
  },
  {
    name: "task:approve",
    description: "Approve a completed task (control only)",
    parameters: {
      type: "object",
      properties: {
        chainId: { type: "string", description: "Chain ID" },
        taskId: { type: "string", description: "Task ID" },
      },
      required: ["chainId", "taskId"],
    },
    category: "task",
    mutates: true,
  },
  {
    name: "task:complete",
    description: "Mark task as complete (impl only)",
    parameters: {
      type: "object",
      properties: {
        chainId: { type: "string", description: "Chain ID" },
        taskId: { type: "string", description: "Task ID" },
        summary: { type: "string", description: "Completion summary" },
      },
      required: ["chainId", "taskId"],
    },
    category: "task",
    mutates: true,
  },
  {
    name: "spawn_impl_session",
    description: "Spawn an impl session (control only)",
    parameters: {
      type: "object",
      properties: {
        chainId: { type: "string", description: "Chain ID" },
        taskId: { type: "string", description: "Task ID" },
      },
      required: ["chainId", "taskId"],
    },
    category: "session",
    mutates: true,
  },
];

/**
 * Create test dependencies with mock executors.
 */
function createTestDependencies() {
  const registry = new ToolRegistry(integrationTestTools);
  const governanceGate = new GovernanceGate(registry);
  const promptLoader = createMockPromptLoader();
  const roleManager = {
    get: vi.fn(async (roleId: string) => {
      if (roleId === "controller" || roleId === "control") {
        return {
          id: roleId,
          name: "Controller",
          toolIds: ["chain:status", "task:approve", "spawn_impl_session"],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      if (roleId === "implementer" || roleId === "impl") {
        return {
          id: roleId,
          name: "Implementer",
          toolIds: ["chain:status", "task:complete"],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return null;
    }),
  } as unknown as RoleManager;

  // Create mock executors for each tool
  const chainStatusExecutor = vi.fn(async () => ({
    success: true,
    data: { chainId: "CHAIN-037", status: "active", taskCount: 5 },
  }));
  const taskApproveExecutor = vi.fn(async () => ({
    success: true,
    data: { taskId: "001", status: "approved" },
  }));
  const taskCompleteExecutor = vi.fn(async () => ({
    success: true,
    data: { taskId: "001", status: "completed" },
  }));
  const spawnImplSessionExecutor = vi.fn(async () => ({
    success: true,
    data: { sessionId: "session-123" },
  }));

  const executorMap = new Map<string, ToolExecutorFn>([
    ["chain:status", chainStatusExecutor],
    ["task:approve", taskApproveExecutor],
    ["task:complete", taskCompleteExecutor],
    ["spawn_impl_session", spawnImplSessionExecutor],
  ]);

  const executor = new ToolExecutor(executorMap);

  return { registry, governanceGate, executor, promptLoader, chainStatusExecutor, roleManager };
}

describe("Agent Runtime Integration Tests", () => {
  let testWorkspace: string;

  beforeEach(async () => {
    // Suppress console output during tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Create a unique temp directory for each test
    testWorkspace = join(tmpdir(), `choragen-integration-test-${Date.now()}`);
    await mkdir(testWorkspace, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directory
    await rm(testWorkspace, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe("Control Agent Role Permissions", () => {
    it("control agent can call allowed tools (chain:status, task:approve)", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "Let me check the chain status",
          toolCalls: [
            { id: "call-1", name: "chain:status", arguments: { chainId: "CHAIN-037" } },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Now I will approve the task",
          toolCalls: [
            {
              id: "call-2",
              name: "task:approve",
              arguments: { chainId: "CHAIN-037", taskId: "001" },
            },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 150, outputTokens: 75 },
        },
        {
          content: "Task approved successfully",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "control",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
          chainId: "CHAIN-037",
        },
        deps
      );

      expect(result.success).toBe(true);
      expect(result.toolCalls).toHaveLength(2);
      expect(result.toolCalls[0].name).toBe("chain:status");
      expect(result.toolCalls[0].allowed).toBe(true);
      expect(result.toolCalls[0].result?.success).toBe(true);
      expect(result.toolCalls[1].name).toBe("task:approve");
      expect(result.toolCalls[1].allowed).toBe(true);
      expect(result.toolCalls[1].result?.success).toBe(true);
    });

    it("control agent is denied impl-only tools (task:complete)", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "I will complete this task",
          toolCalls: [
            {
              id: "call-1",
              name: "task:complete",
              arguments: { chainId: "CHAIN-037", taskId: "001" },
            },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "I understand I cannot complete tasks as a control agent",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 150, outputTokens: 75 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "control",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
        },
        deps
      );

      expect(result.success).toBe(true);
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe("task:complete");
      expect(result.toolCalls[0].allowed).toBe(false);
      expect(result.toolCalls[0].denialReason).toContain("Tool not allowed for role");
    });
  });

  describe("Impl Agent Role Permissions", () => {
    it("impl agent can call allowed tools (chain:status, task:complete)", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "Let me check the chain status first",
          toolCalls: [
            { id: "call-1", name: "chain:status", arguments: { chainId: "CHAIN-037" } },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Now I will complete my task",
          toolCalls: [
            {
              id: "call-2",
              name: "task:complete",
              arguments: {
                chainId: "CHAIN-037",
                taskId: "001",
                summary: "Implemented feature X",
              },
            },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 150, outputTokens: 75 },
        },
        {
          content: "Task completed successfully",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
          chainId: "CHAIN-037",
          taskId: "001",
        },
        deps
      );

      expect(result.success).toBe(true);
      expect(result.toolCalls).toHaveLength(2);
      expect(result.toolCalls[0].name).toBe("chain:status");
      expect(result.toolCalls[0].allowed).toBe(true);
      expect(result.toolCalls[1].name).toBe("task:complete");
      expect(result.toolCalls[1].allowed).toBe(true);
    });

    it("impl agent is denied control-only tools (task:approve)", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "I will approve this task",
          toolCalls: [
            {
              id: "call-1",
              name: "task:approve",
              arguments: { chainId: "CHAIN-037", taskId: "001" },
            },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "I understand I cannot approve tasks",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 150, outputTokens: 75 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
        },
        deps
      );

      expect(result.success).toBe(true);
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe("task:approve");
      expect(result.toolCalls[0].allowed).toBe(false);
      expect(result.toolCalls[0].denialReason).toContain("Tool not allowed for role");
    });

    it("impl agent is denied spawn_impl_session (control-only)", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "I will spawn another impl session",
          toolCalls: [
            {
              id: "call-1",
              name: "spawn_impl_session",
              arguments: { chainId: "CHAIN-037", taskId: "002" },
            },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "I cannot spawn sessions as an impl agent",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 150, outputTokens: 75 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
        },
        deps
      );

      expect(result.toolCalls[0].allowed).toBe(false);
      expect(result.toolCalls[0].denialReason).toContain("Tool not allowed for role");
    });
  });

  describe("Tool Results in Conversation", () => {
    it("tool results are added to conversation history", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "Checking chain status",
          toolCalls: [
            { id: "call-1", name: "chain:status", arguments: { chainId: "CHAIN-037" } },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Chain has 5 tasks",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 150, outputTokens: 75 },
        },
      ]);

      await runAgentSession(
        {
          role: "control",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
        },
        deps
      );

      // Check that the second chat call includes tool result
      const secondCall = mockProvider.chatCalls[1];
      expect(secondCall).toBeDefined();

      // Find the tool message in the conversation
      const toolMessage = secondCall.messages.find((m) => m.role === "tool");
      expect(toolMessage).toBeDefined();
      expect(toolMessage?.toolCallId).toBe("call-1");
      expect(toolMessage?.toolName).toBe("chain:status");

      // Verify the result content
      const resultContent = JSON.parse(toolMessage!.content);
      expect(resultContent.success).toBe(true);
      expect(resultContent.data.chainId).toBe("CHAIN-037");
      expect(resultContent.data.taskCount).toBe(5);
    });

    it("governance denial results are added to conversation", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "I will approve this task",
          toolCalls: [
            {
              id: "call-1",
              name: "task:approve",
              arguments: { chainId: "CHAIN-037", taskId: "001" },
            },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "I see I cannot do that",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 150, outputTokens: 75 },
        },
      ]);

      await runAgentSession(
        {
          role: "impl",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
        },
        deps
      );

      // Check that the second chat call includes denial message
      const secondCall = mockProvider.chatCalls[1];
      const toolMessage = secondCall.messages.find((m) => m.role === "tool");
      expect(toolMessage).toBeDefined();

      const resultContent = JSON.parse(toolMessage!.content);
      expect(resultContent.error).toContain("DENIED");
      expect(resultContent.error).toContain("Tool not allowed for role");
    });
  });

  describe("Governance Violation Error Messages", () => {
    it("governance violations return clear error messages", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "Trying control-only tool as impl",
          toolCalls: [
            {
              id: "call-1",
              name: "task:approve",
              arguments: { chainId: "X", taskId: "Y" },
            },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Understood",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
        },
        deps
      );

      const deniedCall = result.toolCalls[0];
      expect(deniedCall.allowed).toBe(false);
      expect(deniedCall.denialReason).toBeDefined();
      expect(deniedCall.denialReason).toBe("Tool not allowed for role");
    });

    it("unknown tools return clear error messages", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "Using unknown tool",
          toolCalls: [
            {
              id: "call-1",
              name: "nonexistent:tool",
              arguments: {},
            },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "That tool does not exist",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
        },
        deps
      );

      expect(result.toolCalls[0].allowed).toBe(false);
      expect(result.toolCalls[0].denialReason).toContain("Unknown tool");
      expect(result.toolCalls[0].denialReason).toContain("nonexistent:tool");
    });
  });

  describe("Session Termination", () => {
    it("session terminates on end_turn", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "Work complete, ending session",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
        },
        deps
      );

      expect(result.success).toBe(true);
      expect(result.stopReason).toBe("end_turn");
      expect(result.iterations).toBe(1);
    });

    it("session terminates on max iterations", async () => {
      const MAX_ITERATIONS = 3;
      const deps = createTestDependencies();

      // Create responses that never end
      const responses: ChatResponse[] = Array(MAX_ITERATIONS + 1).fill({
        content: "Still working...",
        toolCalls: [],
        stopReason: "tool_use",
        usage: { inputTokens: 10, outputTokens: 10 },
      });

      const mockProvider = new MockLLMProvider(responses);

      const result = await runAgentSession(
        {
          role: "impl",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
          maxIterations: MAX_ITERATIONS,
        },
        deps
      );

      expect(result.success).toBe(false);
      expect(result.stopReason).toBe("max_iterations");
      expect(result.iterations).toBe(MAX_ITERATIONS);
      expect(result.error).toContain(`${MAX_ITERATIONS}`);
    });

    it("session terminates after tool call followed by end_turn", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "Checking status",
          toolCalls: [
            { id: "call-1", name: "chain:status", arguments: { chainId: "CHAIN-037" } },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "All done",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "control",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
        },
        deps
      );

      expect(result.success).toBe(true);
      expect(result.stopReason).toBe("end_turn");
      expect(result.iterations).toBe(2);
      expect(result.toolCalls).toHaveLength(1);
    });
  });

  describe("Session State Persistence", () => {
    it("session state is persisted to file", async () => {
      // Token counts for this test
      const INPUT_TOKENS = 100;
      const OUTPUT_TOKENS = 50;

      const mockProvider = new MockLLMProvider([
        {
          content: "Checking chain",
          toolCalls: [
            { id: "call-1", name: "chain:status", arguments: { chainId: "CHAIN-037" } },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: INPUT_TOKENS, outputTokens: OUTPUT_TOKENS },
        },
        {
          content: "Done",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: OUTPUT_TOKENS, outputTokens: 25 },
        },
      ]);

      // MockProvider created but not used directly - we test Session persistence separately
      void mockProvider;

      // Run session and manually save state
      const session = new Session({
        role: "control",
        model: "mock-model",
        chainId: "CHAIN-037",
        workspaceRoot: testWorkspace,
      });

      // Simulate session activity
      session.addMessage({ role: "system", content: "You are a test agent." });
      session.addMessage({ role: "user", content: "Check the chain status." });
      session.updateTokenUsage(INPUT_TOKENS, OUTPUT_TOKENS);

      await session.recordToolCall({
        timestamp: new Date().toISOString(),
        name: "chain:status",
        params: { chainId: "CHAIN-037" },
        result: { success: true, data: { status: "active" } },
        governanceResult: { allowed: true },
      });

      await session.end("success");

      // Verify file was created
      const sessionsDir = join(testWorkspace, ".choragen/sessions");
      const files = await readdir(sessionsDir);
      expect(files).toHaveLength(1);
      expect(files[0]).toBe(`${session.id}.json`);

      // Verify file contents
      const filePath = join(sessionsDir, files[0]);
      const content = await readFile(filePath, "utf-8");
      const data = JSON.parse(content);

      expect(data.id).toBe(session.id);
      expect(data.role).toBe("control");
      expect(data.chainId).toBe("CHAIN-037");
      expect(data.outcome).toBe("success");
      expect(data.messages).toHaveLength(2);
      expect(data.toolCalls).toHaveLength(1);
      expect(data.tokenUsage.input).toBe(INPUT_TOKENS);
      expect(data.tokenUsage.output).toBe(OUTPUT_TOKENS);
    });

    it("session can be loaded from persisted file", async () => {
      // Token counts for this test
      const PERSISTED_INPUT_TOKENS = 200;
      const PERSISTED_OUTPUT_TOKENS = 100;

      // Create and save a session
      const originalSession = new Session({
        role: "impl",
        model: "mock-model",
        chainId: "CHAIN-037",
        taskId: "001",
        workspaceRoot: testWorkspace,
      });

      originalSession.addMessage({ role: "system", content: "Test prompt" });
      originalSession.updateTokenUsage(PERSISTED_INPUT_TOKENS, PERSISTED_OUTPUT_TOKENS);
      await originalSession.end("success");

      // Load the session
      const loadedSession = await Session.load(originalSession.id, testWorkspace);

      expect(loadedSession).not.toBeNull();
      expect(loadedSession!.id).toBe(originalSession.id);
      expect(loadedSession!.role).toBe("impl");
      expect(loadedSession!.chainId).toBe("CHAIN-037");
      expect(loadedSession!.taskId).toBe("001");
      expect(loadedSession!.outcome).toBe("success");
      expect(loadedSession!.tokenUsage.input).toBe(PERSISTED_INPUT_TOKENS);
      expect(loadedSession!.tokenUsage.output).toBe(PERSISTED_OUTPUT_TOKENS);
    });
  });

  describe("Dry-Run Mode", () => {
    it("dry-run mode validates but does not execute tools", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "Checking chain status",
          toolCalls: [
            { id: "call-1", name: "chain:status", arguments: { chainId: "CHAIN-037" } },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Done",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "control",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
          dryRun: true,
        },
        deps
      );

      expect(result.success).toBe(true);
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].allowed).toBe(true);
      expect(result.toolCalls[0].result?.data).toEqual({ dryRun: true });

      // Verify executor was NOT called
      expect(deps.chainStatusExecutor).not.toHaveBeenCalled();
    });

    it("dry-run mode still enforces governance", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "Trying to approve as impl",
          toolCalls: [
            {
              id: "call-1",
              name: "task:approve",
              arguments: { chainId: "CHAIN-037", taskId: "001" },
            },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Cannot do that",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
          dryRun: true,
        },
        deps
      );

      expect(result.toolCalls[0].allowed).toBe(false);
      expect(result.toolCalls[0].denialReason).toContain("Tool not allowed for role");
    });
  });

  describe("Token Usage Tracking", () => {
    it("accumulates token usage across iterations", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "First response",
          toolCalls: [],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Second response",
          toolCalls: [],
          stopReason: "tool_use",
          usage: { inputTokens: 150, outputTokens: 75 },
        },
        {
          content: "Final response",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 200, outputTokens: 100 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
        },
        deps
      );

      expect(result.tokensUsed.input).toBe(450); // 100 + 150 + 200
      expect(result.tokensUsed.output).toBe(225); // 50 + 75 + 100
    });
  });

  describe("Complete End-to-End Scenarios", () => {
    it("impl agent workflow: check status, complete task, end", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "Let me check the chain status first",
          toolCalls: [
            { id: "call-1", name: "chain:status", arguments: { chainId: "CHAIN-037" } },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Chain is active. Now completing my task.",
          toolCalls: [
            {
              id: "call-2",
              name: "task:complete",
              arguments: {
                chainId: "CHAIN-037",
                taskId: "009",
                summary: "Implemented integration tests",
              },
            },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 200, outputTokens: 100 },
        },
        {
          content: "Task completed successfully. Session ending.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 150, outputTokens: 75 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
          chainId: "CHAIN-037",
          taskId: "009",
        },
        deps
      );

      expect(result.success).toBe(true);
      expect(result.stopReason).toBe("end_turn");
      expect(result.iterations).toBe(3);
      expect(result.toolCalls).toHaveLength(2);
      expect(result.toolCalls.every((tc) => tc.allowed)).toBe(true);
      expect(result.toolCalls.every((tc) => tc.result?.success)).toBe(true);
      expect(result.tokensUsed.input).toBe(450);
      expect(result.tokensUsed.output).toBe(225);
    });

    it("control agent workflow: check status, spawn impl, approve task", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "Checking chain status",
          toolCalls: [
            { id: "call-1", name: "chain:status", arguments: { chainId: "CHAIN-037" } },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Spawning impl session for task",
          toolCalls: [
            {
              id: "call-2",
              name: "spawn_impl_session",
              arguments: { chainId: "CHAIN-037", taskId: "010" },
            },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 150, outputTokens: 75 },
        },
        {
          content: "Approving completed task",
          toolCalls: [
            {
              id: "call-3",
              name: "task:approve",
              arguments: { chainId: "CHAIN-037", taskId: "009" },
            },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 200, outputTokens: 100 },
        },
        {
          content: "All tasks managed. Session complete.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "control",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
          chainId: "CHAIN-037",
        },
        deps
      );

      expect(result.success).toBe(true);
      expect(result.stopReason).toBe("end_turn");
      expect(result.iterations).toBe(4);
      expect(result.toolCalls).toHaveLength(3);
      expect(result.toolCalls[0].name).toBe("chain:status");
      expect(result.toolCalls[1].name).toBe("spawn_impl_session");
      expect(result.toolCalls[2].name).toBe("task:approve");
      expect(result.toolCalls.every((tc) => tc.allowed)).toBe(true);
    });

    it("mixed scenario: agent tries forbidden tool, then uses allowed tool", async () => {
      const deps = createTestDependencies();
      const mockProvider = new MockLLMProvider([
        {
          content: "I will try to approve this task",
          toolCalls: [
            {
              id: "call-1",
              name: "task:approve",
              arguments: { chainId: "CHAIN-037", taskId: "001" },
            },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "I see I cannot approve. Let me complete my task instead.",
          toolCalls: [
            {
              id: "call-2",
              name: "task:complete",
              arguments: { chainId: "CHAIN-037", taskId: "001" },
            },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 150, outputTokens: 75 },
        },
        {
          content: "Task completed. Done.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider: mockProvider,
          workspaceRoot: testWorkspace,
        },
        deps
      );

      expect(result.success).toBe(true);
      expect(result.toolCalls).toHaveLength(2);
      expect(result.toolCalls[0].allowed).toBe(false);
      expect(result.toolCalls[0].denialReason).toContain("Tool not allowed for role");
      expect(result.toolCalls[1].allowed).toBe(true);
      expect(result.toolCalls[1].result?.success).toBe(true);
    });
  });
});
