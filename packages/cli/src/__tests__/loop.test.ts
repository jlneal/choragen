/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify agentic loop correctly orchestrates LLM calls, tool execution, and governance"
 * @test-type unit
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  runAgentSession,
  type AgentSessionConfig,
} from "../runtime/loop.js";
import type { LLMProvider, ChatResponse, Message, Tool } from "../runtime/providers/types.js";
import { ToolRegistry } from "../runtime/tools/registry.js";
import { ToolExecutor } from "../runtime/tools/executor.js";
import { GovernanceGate } from "../runtime/governance-gate.js";
import { PromptLoader } from "../runtime/prompt-loader.js";
import type { ToolDefinition } from "../runtime/tools/types.js";
import type { RoleManager } from "@choragen/core";
import { join } from "node:path";
import { mkdir, rm } from "node:fs/promises";

/**
 * Create a mock LLM provider for testing.
 */
function createMockProvider(responses: ChatResponse[]): LLMProvider {
  let callIndex = 0;
  return {
    name: "anthropic",
    model: "claude-test",
    chat: vi.fn(async (_messages: Message[], _tools: Tool[]): Promise<ChatResponse> => {
      if (callIndex >= responses.length) {
        throw new Error("No more mock responses available");
      }
      return responses[callIndex++];
    }),
  };
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
 * Test tool definitions.
 */
const testTools: ToolDefinition[] = [
  {
    name: "test:allowed",
    description: "A test tool allowed for both roles",
    parameters: { type: "object", properties: {} },
    category: "task",
    mutates: false,
  },
  {
    name: "test:control-only",
    description: "A test tool only for control",
    parameters: { type: "object", properties: {} },
    category: "task",
    mutates: false,
  },
  {
    name: "test:impl-only",
    description: "A test tool only for impl",
    parameters: { type: "object", properties: {} },
    category: "task",
    mutates: false,
  },
];

const ALL_TEST_TOOL_IDS = testTools.map((tool) => tool.name);

const createTestRoleManager = (toolIds: string[] = ALL_TEST_TOOL_IDS): RoleManager => {
  return {
    get: vi.fn(async (roleId: string) => {
      return {
        id: roleId,
        name: roleId,
        toolIds,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),
  } as unknown as RoleManager;
};

describe("runAgentSession", () => {
  let baseConfig: AgentSessionConfig;
  let mockExecutor: ToolExecutor;
  let mockRegistry: ToolRegistry;
  let mockGovernanceGate: GovernanceGate;
  let mockPromptLoader: PromptLoader;
  let testWorkspace: string;

  const deps = (overrides: Record<string, unknown> = {}) => ({
    registry: mockRegistry,
    executor: mockExecutor,
    governanceGate: mockGovernanceGate,
    promptLoader: mockPromptLoader,
    roleManager: createTestRoleManager(),
    ...overrides,
  });

  beforeEach(async () => {
    // Suppress console output during tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    testWorkspace = join(process.cwd(), ".tmp-cli-loop-tests");
    await rm(testWorkspace, { recursive: true, force: true });
    await mkdir(testWorkspace, { recursive: true });

    // Create test dependencies
    mockRegistry = new ToolRegistry(testTools);
    mockGovernanceGate = new GovernanceGate(mockRegistry);
    mockExecutor = new ToolExecutor(new Map([
      ["test:allowed", vi.fn(async () => ({ success: true, data: { result: "ok" } }))],
      ["test:control-only", vi.fn(async () => ({ success: true, data: { result: "control" } }))],
      ["test:impl-only", vi.fn(async () => ({ success: true, data: { result: "impl" } }))],
    ]));
    mockPromptLoader = createMockPromptLoader();

    baseConfig = {
      role: "impl",
      roleId: "implementer",
      provider: createMockProvider([]),
      workspaceRoot: testWorkspace,
    };
  });

  afterEach(async () => {
    await rm(testWorkspace, { recursive: true, force: true });
  });

  describe("basic loop execution", () => {
    it("terminates on end_turn stop reason", async () => {
      const provider = createMockProvider([
        {
          content: "Task complete.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
      ]);

      const result = await runAgentSession(
        { ...baseConfig, provider },
        deps()
      );

      expect(result.success).toBe(true);
      expect(result.stopReason).toBe("end_turn");
      expect(result.iterations).toBe(1);
    });

    it("terminates on max iterations", async () => {
      const MAX_ITERATIONS = 3;
      const responses: ChatResponse[] = Array(MAX_ITERATIONS + 1).fill({
        content: "Continuing...",
        toolCalls: [],
        stopReason: "tool_use",
        usage: { inputTokens: 10, outputTokens: 10 },
      });

      const provider = createMockProvider(responses);

      const result = await runAgentSession(
        { ...baseConfig, provider, maxIterations: MAX_ITERATIONS },
        deps()
      );

      expect(result.success).toBe(false);
      expect(result.stopReason).toBe("max_iterations");
      expect(result.iterations).toBe(MAX_ITERATIONS);
      expect(result.error).toContain(`${MAX_ITERATIONS}`);
    });

    it("uses default max iterations of 50", async () => {
      const DEFAULT_MAX = 50;
      // Create enough responses for default max
      const responses: ChatResponse[] = Array(DEFAULT_MAX + 1).fill({
        content: "Continuing...",
        toolCalls: [],
        stopReason: "tool_use",
        usage: { inputTokens: 1, outputTokens: 1 },
      });

      const provider = createMockProvider(responses);

      const result = await runAgentSession(
        { ...baseConfig, provider },
        deps()
      );

      expect(result.iterations).toBe(DEFAULT_MAX);
      expect(result.stopReason).toBe("max_iterations");
    });
  });

  describe("tool execution", () => {
    it("executes allowed tool calls", async () => {
      const provider = createMockProvider([
        {
          content: "",
          toolCalls: [
            { id: "call-1", name: "test:allowed", arguments: { foo: "bar" } },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Done.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
      ]);

      const result = await runAgentSession(
        { ...baseConfig, provider },
        deps()
      );

      expect(result.success).toBe(true);
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe("test:allowed");
      expect(result.toolCalls[0].allowed).toBe(true);
      expect(result.toolCalls[0].result?.success).toBe(true);
    });

    it("records tool call arguments", async () => {
      const provider = createMockProvider([
        {
          content: "",
          toolCalls: [
            { id: "call-1", name: "test:allowed", arguments: { key: "value", num: 42 } },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Done.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
      ]);

      const result = await runAgentSession(
        { ...baseConfig, provider },
        deps()
      );

      expect(result.toolCalls[0].arguments).toEqual({ key: "value", num: 42 });
    });

    it("handles multiple tool calls in one response", async () => {
      const provider = createMockProvider([
        {
          content: "",
          toolCalls: [
            { id: "call-1", name: "test:allowed", arguments: {} },
            { id: "call-2", name: "test:impl-only", arguments: {} },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Done.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
      ]);

      const result = await runAgentSession(
        { ...baseConfig, provider },
        deps()
      );

      expect(result.toolCalls).toHaveLength(2);
      expect(result.toolCalls[0].name).toBe("test:allowed");
      expect(result.toolCalls[1].name).toBe("test:impl-only");
    });
  });

  describe("governance validation", () => {
    it("denies tool calls that violate role permissions", async () => {
      // impl role trying to use control-only tool
      const provider = createMockProvider([
        {
          content: "",
          toolCalls: [
            { id: "call-1", name: "test:control-only", arguments: {} },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Understood, I cannot use that tool.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
      ]);

      const result = await runAgentSession(
        { ...baseConfig, role: "impl", provider },
        deps({ roleManager: createTestRoleManager(["test:allowed", "test:impl-only"]) })
      );

      expect(result.success).toBe(true);
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].allowed).toBe(false);
      expect(result.toolCalls[0].denialReason).toContain("Tool not allowed for role");
    });

    it("denies unknown tools", async () => {
      const provider = createMockProvider([
        {
          content: "",
          toolCalls: [
            { id: "call-1", name: "unknown:tool", arguments: {} },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "I'll try something else.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
      ]);

      const result = await runAgentSession(
        { ...baseConfig, provider },
        deps()
      );

      expect(result.toolCalls[0].allowed).toBe(false);
      expect(result.toolCalls[0].denialReason).toContain("Unknown tool");
    });

    it("continues loop after governance denial", async () => {
      const provider = createMockProvider([
        {
          content: "",
          toolCalls: [
            { id: "call-1", name: "test:control-only", arguments: {} },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "",
          toolCalls: [
            { id: "call-2", name: "test:allowed", arguments: {} },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
        {
          content: "Done.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 25, outputTokens: 10 },
        },
      ]);

      const result = await runAgentSession(
        { ...baseConfig, role: "impl", provider },
        deps({ roleManager: createTestRoleManager(["test:allowed", "test:impl-only"]) })
      );

      expect(result.success).toBe(true);
      expect(result.iterations).toBe(3);
      expect(result.toolCalls).toHaveLength(2);
      expect(result.toolCalls[0].allowed).toBe(false);
      expect(result.toolCalls[1].allowed).toBe(true);
    });
  });

  describe("token tracking", () => {
    it("accumulates token usage across iterations", async () => {
      const provider = createMockProvider([
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
          content: "Done",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 200, outputTokens: 100 },
        },
      ]);

      const result = await runAgentSession(
        { ...baseConfig, provider },
        deps()
      );

      expect(result.tokensUsed.input).toBe(450); // 100 + 150 + 200
      expect(result.tokensUsed.output).toBe(225); // 50 + 75 + 100
    });
  });

  describe("dry run mode", () => {
    it("validates but does not execute tools in dry run mode", async () => {
      const executorSpy = vi.fn(async () => ({ success: true, data: {} }));
      const dryRunExecutor = new ToolExecutor(new Map([
        ["test:allowed", executorSpy],
      ]));

      const provider = createMockProvider([
        {
          content: "",
          toolCalls: [
            { id: "call-1", name: "test:allowed", arguments: {} },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Done.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
      ]);

      const result = await runAgentSession(
        { ...baseConfig, provider, dryRun: true },
        deps({ executor: dryRunExecutor })
      );

      expect(result.success).toBe(true);
      expect(result.toolCalls[0].allowed).toBe(true);
      expect(result.toolCalls[0].result?.data).toEqual({ dryRun: true });
      expect(executorSpy).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("handles LLM provider errors gracefully", async () => {
      const provider: LLMProvider = {
        name: "anthropic",
        model: "claude-test",
        chat: vi.fn(async () => {
          throw new Error("API rate limit exceeded");
        }),
      };

      // Disable retry to avoid timeout waiting for backoff delays
      const result = await runAgentSession(
        { ...baseConfig, provider, retryConfig: { enabled: false } },
        deps()
      );

      expect(result.success).toBe(false);
      expect(result.stopReason).toBe("error");
      expect(result.error).toContain("API rate limit exceeded");
    });

    it("handles tool execution errors gracefully", async () => {
      const failingExecutor = new ToolExecutor(new Map([
        ["test:allowed", vi.fn(async () => {
          throw new Error("Tool crashed");
        })],
      ]));

      const provider = createMockProvider([
        {
          content: "",
          toolCalls: [
            { id: "call-1", name: "test:allowed", arguments: {} },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Done.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
      ]);

      const result = await runAgentSession(
        { ...baseConfig, provider },
        deps({ executor: failingExecutor })
      );

      // Loop should continue despite tool error
      expect(result.success).toBe(true);
      expect(result.toolCalls[0].result?.success).toBe(false);
      expect(result.toolCalls[0].result?.error).toContain("Tool crashed");
    });
  });

  describe("session context", () => {
    it("passes chain and task context to prompt loader", async () => {
      const promptLoaderSpy = vi.spyOn(mockPromptLoader, "load");

      const provider = createMockProvider([
        {
          content: "Done.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
      ]);

      await runAgentSession(
        { ...baseConfig, provider, chainId: "CHAIN-001", taskId: "001" },
        deps()
      );

      expect(promptLoaderSpy).toHaveBeenCalledWith(
        "impl",
        expect.objectContaining({
          chainId: "CHAIN-001",
          taskId: "001",
          workspaceRoot: testWorkspace,
        })
      );
    });

    it("generates unique session IDs", async () => {
      const sessionIds: string[] = [];
      const captureSessionId = vi.spyOn(mockPromptLoader, "load").mockImplementation(
        async (_role, context) => {
          sessionIds.push(context.sessionId);
          return "Test prompt";
        }
      );

      const provider1 = createMockProvider([
        { content: "Done.", toolCalls: [], stopReason: "end_turn", usage: { inputTokens: 10, outputTokens: 5 } },
      ]);
      const provider2 = createMockProvider([
        { content: "Done.", toolCalls: [], stopReason: "end_turn", usage: { inputTokens: 10, outputTokens: 5 } },
      ]);

      await runAgentSession(
        { ...baseConfig, provider: provider1 },
        deps()
      );
      await runAgentSession(
        { ...baseConfig, provider: provider2 },
        deps()
      );

      expect(sessionIds).toHaveLength(2);
      expect(sessionIds[0]).not.toBe(sessionIds[1]);

      captureSessionId.mockRestore();
    });
  });

  describe("role-specific behavior", () => {
    it("uses control role tools for control agent", async () => {
      const provider = createMockProvider([
        {
          content: "",
          toolCalls: [
            { id: "call-1", name: "test:control-only", arguments: {} },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Done.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
      ]);

      const result = await runAgentSession(
        {
          ...baseConfig,
          role: "control",
          roleId: "controller",
          roleManager: createTestRoleManager(),
          provider,
        },
        deps()
      );

      expect(result.toolCalls[0].allowed).toBe(true);
    });

    it("uses impl role tools for impl agent", async () => {
      const provider = createMockProvider([
        {
          content: "",
          toolCalls: [
            { id: "call-1", name: "test:impl-only", arguments: {} },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Done.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
      ]);

      const result = await runAgentSession(
        { ...baseConfig, role: "impl", provider },
        deps()
      );

      expect(result.toolCalls[0].allowed).toBe(true);
    });
  });
});

describe("SessionResult interface", () => {
  it("includes all required fields on success", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    const mockPromptLoader = createMockPromptLoader();
    const mockRegistry = new ToolRegistry(testTools);
    const mockGovernanceGate = new GovernanceGate(mockRegistry);
    const mockExecutor = new ToolExecutor(new Map());
    const workspaceRoot = join(process.cwd(), ".tmp-cli-loop-success");
    await rm(workspaceRoot, { recursive: true, force: true });
    await mkdir(workspaceRoot, { recursive: true });

    const provider = createMockProvider([
      {
        content: "Done.",
        toolCalls: [],
        stopReason: "end_turn",
        usage: { inputTokens: 100, outputTokens: 50 },
      },
    ]);

    const result = await runAgentSession(
      { role: "impl", provider, workspaceRoot },
      {
        registry: mockRegistry,
        executor: mockExecutor,
        governanceGate: mockGovernanceGate,
        promptLoader: mockPromptLoader,
        roleManager: createTestRoleManager(),
      }
    );

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("iterations");
    expect(result).toHaveProperty("toolCalls");
    expect(result).toHaveProperty("tokensUsed");
    expect(result).toHaveProperty("stopReason");
    expect(result.tokensUsed).toHaveProperty("input");
    expect(result.tokensUsed).toHaveProperty("output");
  });

  it("includes error field on failure", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    const mockPromptLoader = createMockPromptLoader();
    const mockRegistry = new ToolRegistry(testTools);
    const mockGovernanceGate = new GovernanceGate(mockRegistry);
    const mockExecutor = new ToolExecutor(new Map());
    const workspaceRoot = join(process.cwd(), ".tmp-cli-loop-error");
    await rm(workspaceRoot, { recursive: true, force: true });
    await mkdir(workspaceRoot, { recursive: true });

    const provider: LLMProvider = {
      name: "anthropic",
      model: "claude-test",
      chat: vi.fn(async () => {
        throw new Error("Test error");
      }),
    };

    const result = await runAgentSession(
      { role: "impl", provider, workspaceRoot },
      {
        registry: mockRegistry,
        executor: mockExecutor,
        governanceGate: mockGovernanceGate,
        promptLoader: mockPromptLoader,
        roleManager: createTestRoleManager(),
      }
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.stopReason).toBe("error");
  });
});

describe("ToolCallRecord interface", () => {
  it("includes timestamp for each tool call", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    const mockPromptLoader = createMockPromptLoader();
    const mockRegistry = new ToolRegistry(testTools);
    const mockGovernanceGate = new GovernanceGate(mockRegistry);
    const mockExecutor = new ToolExecutor(new Map([
      ["test:allowed", vi.fn(async () => ({ success: true, data: {} }))],
    ]));
    const workspaceRoot = join(process.cwd(), ".tmp-cli-loop-toolcall");
    await rm(workspaceRoot, { recursive: true, force: true });
    await mkdir(workspaceRoot, { recursive: true });

    const provider = createMockProvider([
      {
        content: "",
        toolCalls: [
          { id: "call-1", name: "test:allowed", arguments: {} },
        ],
        stopReason: "tool_use",
        usage: { inputTokens: 100, outputTokens: 50 },
      },
      {
        content: "Done.",
        toolCalls: [],
        stopReason: "end_turn",
        usage: { inputTokens: 50, outputTokens: 25 },
      },
    ]);

    const result = await runAgentSession(
      { role: "impl", provider, workspaceRoot },
      {
        registry: mockRegistry,
        executor: mockExecutor,
        governanceGate: mockGovernanceGate,
        promptLoader: mockPromptLoader,
        roleManager: createTestRoleManager(),
      }
    );

    expect(result.toolCalls[0].timestamp).toBeDefined();
    expect(new Date(result.toolCalls[0].timestamp).toISOString()).toBe(result.toolCalls[0].timestamp);
  });
});
