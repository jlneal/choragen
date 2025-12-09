/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify Phase 4 production hardening features work together correctly"
 * @test-type integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runAgentSession } from "../runtime/loop.js";
import type { LLMProvider, ChatResponse, Message, Tool, ProviderName, StopReason } from "../runtime/providers/types.js";
import { HttpStatus } from "@choragen/contracts";
import { ToolRegistry } from "../runtime/tools/registry.js";
import { ToolExecutor } from "../runtime/tools/executor.js";
import { GovernanceGate } from "../runtime/governance-gate.js";
import { PromptLoader } from "../runtime/prompt-loader.js";
import { CheckpointHandler, type ApprovalResult } from "../runtime/checkpoint.js";
import { Session } from "../runtime/session.js";
import { ShutdownHandler } from "../runtime/shutdown.js";
import type { ToolDefinition } from "../runtime/tools/types.js";
import type { RetryableError } from "../runtime/retry.js";

// Test constants for token counts and timeouts (not HTTP status codes)
const TEST_INPUT_TOKENS_500 = 500;
const TEST_OUTPUT_TOKENS_200 = 200;
const TEST_INPUT_TOKENS_200 = 200;
const TEST_OUTPUT_TOKENS_100 = 100;
const SHORT_TIMEOUT_MS = 100;

/**
 * Create a mock LLM provider that returns predefined responses.
 */
function createMockProvider(responses: ChatResponse[]): LLMProvider {
  let callIndex = 0;
  return {
    name: "anthropic" as ProviderName,
    model: "mock-model",
    chat: vi.fn(async (_messages: Message[], _tools: Tool[]): Promise<ChatResponse> => {
      if (callIndex >= responses.length) {
        throw new Error("No more mock responses available");
      }
      return responses[callIndex++];
    }),
  };
}

/**
 * Create a mock provider that fails with retryable errors then succeeds.
 */
function createFailingThenSucceedingProvider(
  failCount: number,
  errorType: "rate_limit" | "timeout" | "server_error",
  successResponse: ChatResponse
): LLMProvider {
  let callCount = 0;
  return {
    name: "anthropic" as ProviderName,
    model: "mock-model",
    chat: vi.fn(async (): Promise<ChatResponse> => {
      callCount++;
      if (callCount <= failCount) {
        const error = new Error(getErrorMessage(errorType)) as RetryableError;
        error.status = getErrorStatus(errorType);
        throw error;
      }
      return successResponse;
    }),
  };
}

function getErrorMessage(type: "rate_limit" | "timeout" | "server_error"): string {
  switch (type) {
    case "rate_limit":
      return "Rate limit exceeded";
    case "timeout":
      return "Request timeout";
    case "server_error":
      return "Internal server error";
  }
}

function getErrorStatus(type: "rate_limit" | "timeout" | "server_error"): number {
  switch (type) {
    case "rate_limit":
      return HttpStatus.TOO_MANY_REQUESTS;
    case "timeout":
      return 408; // Request Timeout - not in HttpStatus enum
    case "server_error":
      return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

/**
 * Create a mock prompt loader.
 */
function createMockPromptLoader(): PromptLoader {
  const loader = new PromptLoader("/test/workspace");
  vi.spyOn(loader, "load").mockResolvedValue("You are a test agent.");
  return loader;
}

/**
 * Test tool definitions for integration tests.
 */
const integrationTestTools: ToolDefinition[] = [
  {
    name: "test:allowed",
    description: "A test tool allowed for both roles",
    parameters: { type: "object", properties: {} },
    allowedRoles: ["control", "impl"],
  },
  {
    name: "task_complete",
    description: "Mark a task as complete (requires approval)",
    parameters: { type: "object", properties: { taskId: { type: "string" } } },
    allowedRoles: ["control", "impl"],
  },
  {
    name: "write_file",
    description: "Write content to a file",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" },
        content: { type: "string" },
      },
    },
    allowedRoles: ["impl"],
  },
];

describe("Production Hardening Integration", () => {
  let testWorkspace: string;
  let mockRegistry: ToolRegistry;
  let mockExecutor: ToolExecutor;
  let mockGovernanceGate: GovernanceGate;
  let mockPromptLoader: PromptLoader;

  beforeEach(async () => {
    // Suppress console output during tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Create a unique temp directory for each test
    testWorkspace = join(tmpdir(), `choragen-integration-test-${Date.now()}`);
    await mkdir(testWorkspace, { recursive: true });

    // Create test dependencies
    mockRegistry = new ToolRegistry(integrationTestTools);
    mockGovernanceGate = new GovernanceGate(mockRegistry);
    // Create executor with typed handler map
    const handlerMap = new Map<string, (params: Record<string, unknown>) => Promise<{ success: boolean; data?: unknown; error?: string }>>(
      [
        ["test:allowed", async () => ({ success: true, data: { result: "ok" } })],
        ["task_complete", async () => ({ success: true, data: { completed: true } })],
        ["write_file", async () => ({ success: true, data: { written: true } })],
      ]
    );
    mockExecutor = new ToolExecutor(handlerMap);
    mockPromptLoader = createMockPromptLoader();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    // Clean up temp directory
    await rm(testWorkspace, { recursive: true, force: true });
  });

  describe("Session Resume", () => {
    it("should resume from last saved state after simulated crash", async () => {
      // Create and save a session with some state
      const session = new Session({
        role: "impl",
        model: "mock-model",
        chainId: "CHAIN-TEST",
        taskId: "001",
        workspaceRoot: testWorkspace,
      });

      // Add some messages and tool calls to simulate partial progress
      session.addMessage({ role: "system", content: "You are a test agent." });
      session.addMessage({ role: "user", content: "Start working on the task." });
      session.addMessage({ role: "assistant", content: "I will begin working." });
      session.updateTokenUsage(500, 200);

      // Save the session (simulating state before crash)
      await session.save();

      // Load the session (simulating resume after crash)
      const loadedSession = await Session.load(session.id, testWorkspace);

      expect(loadedSession).not.toBeNull();
      expect(loadedSession!.id).toBe(session.id);
      expect(loadedSession!.chainId).toBe("CHAIN-TEST");
      expect(loadedSession!.taskId).toBe("001");
      expect(loadedSession!.messages).toHaveLength(3);
      expect(loadedSession!.tokenUsage.input).toBe(TEST_INPUT_TOKENS_500);
      expect(loadedSession!.tokenUsage.output).toBe(TEST_OUTPUT_TOKENS_200);
    });

    it("should continue with correct message history after resume", async () => {
      // Create initial session
      const session = new Session({
        role: "impl",
        model: "mock-model",
        workspaceRoot: testWorkspace,
      });

      // Add conversation history
      session.addMessage({ role: "system", content: "System prompt" });
      session.addMessage({ role: "user", content: "User request" });
      session.addMessage({ role: "assistant", content: "First response" });
      session.addMessage({ role: "user", content: "Follow up" });
      await session.save();

      // Resume and verify history is intact
      const resumed = await Session.load(session.id, testWorkspace);
      expect(resumed!.messages).toHaveLength(4);
      expect(resumed!.messages[0].content).toBe("System prompt");
      expect(resumed!.messages[3].content).toBe("Follow up");

      // Add more messages after resume
      resumed!.addMessage({ role: "assistant", content: "Continued response" });
      await resumed!.save();

      // Verify persistence
      const reloaded = await Session.load(session.id, testWorkspace);
      expect(reloaded!.messages).toHaveLength(5);
    });
  });

  describe("Cost Controls", () => {
    it("should warn at 80% of token limit", async () => {
      const MAX_TOKENS = 1000;
      const consoleLogSpy = vi.spyOn(console, "log");

      // Provider returns usage that puts us at 80%
      const provider = createMockProvider([
        {
          content: "Working...",
          toolCalls: [],
          stopReason: "tool_use",
          usage: { inputTokens: 600, outputTokens: 200 }, // 800 total = 80%
        },
        {
          content: "Done.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 50 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider,
          workspaceRoot: testWorkspace,
          maxTokens: MAX_TOKENS,
        },
        {
          registry: mockRegistry,
          executor: mockExecutor,
          governanceGate: mockGovernanceGate,
          promptLoader: mockPromptLoader,
        }
      );

      expect(result.success).toBe(true);
      expect(result.costSnapshot).toBeDefined();

      // Verify warning was logged
      const warningCalls = consoleLogSpy.mock.calls.filter(
        (call) => call[0]?.includes?.("WARNING")
      );
      expect(warningCalls.length).toBeGreaterThan(0);
    });

    it("should stop at 100% of token limit", async () => {
      const MAX_TOKENS = 500;

      // Provider returns usage that exceeds limit
      const provider = createMockProvider([
        {
          content: "Working...",
          toolCalls: [],
          stopReason: "tool_use",
          usage: { inputTokens: 400, outputTokens: 200 }, // 600 total > 500 limit
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider,
          workspaceRoot: testWorkspace,
          maxTokens: MAX_TOKENS,
        },
        {
          registry: mockRegistry,
          executor: mockExecutor,
          governanceGate: mockGovernanceGate,
          promptLoader: mockPromptLoader,
        }
      );

      expect(result.success).toBe(false);
      expect(result.stopReason).toBe("cost_limit");
      expect(result.error).toContain("Token limit exceeded");
    });

    it("should track cost across multiple turns", async () => {
      const provider = createMockProvider([
        {
          content: "Turn 1",
          toolCalls: [],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Turn 2",
          toolCalls: [],
          stopReason: "tool_use",
          usage: { inputTokens: 150, outputTokens: 75 },
        },
        {
          content: "Turn 3",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 200, outputTokens: 100 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider,
          workspaceRoot: testWorkspace,
        },
        {
          registry: mockRegistry,
          executor: mockExecutor,
          governanceGate: mockGovernanceGate,
          promptLoader: mockPromptLoader,
        }
      );

      expect(result.success).toBe(true);
      expect(result.tokensUsed.input).toBe(450); // 100 + 150 + 200
      expect(result.tokensUsed.output).toBe(225); // 50 + 75 + 100
      expect(result.costSnapshot).toBeDefined();
      expect(result.costSnapshot!.tokens.total).toBe(675);
    });
  });

  describe("Human Checkpoints", () => {
    it("should pause for approval on sensitive actions", async () => {
      // Create a mock checkpoint handler
      const mockCheckpointHandler = new CheckpointHandler(
        {
          requireApproval: true,
          autoApprove: true, // Auto-approve for test
          approvalTimeoutMs: 1000,
        }
      );

      // Spy on requiresApproval to track what's being checked
      const requiresSpy = vi.spyOn(mockCheckpointHandler, "requiresApproval");

      const provider = createMockProvider([
        {
          content: "",
          toolCalls: [
            { id: "call-1", name: "task_complete", arguments: { taskId: "001" } },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Task completed.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider,
          workspaceRoot: testWorkspace,
          checkpointConfig: {
            requireApproval: true,
            autoApprove: true,
          },
        },
        {
          registry: mockRegistry,
          executor: mockExecutor,
          governanceGate: mockGovernanceGate,
          promptLoader: mockPromptLoader,
          checkpointHandler: mockCheckpointHandler,
        }
      );

      expect(result.success).toBe(true);
      // Verify that requiresApproval was called for task_complete
      expect(requiresSpy).toHaveBeenCalledWith("task_complete", expect.any(Object));
    });

    it("should continue on approval", async () => {
      // Create checkpoint handler that auto-approves
      const mockCheckpointHandler = new CheckpointHandler({
        requireApproval: true,
        autoApprove: true,
        approvalTimeoutMs: 1000,
      });

      const provider = createMockProvider([
        {
          content: "",
          toolCalls: [
            { id: "call-1", name: "task_complete", arguments: { taskId: "001" } },
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
          role: "impl",
          provider,
          workspaceRoot: testWorkspace,
        },
        {
          registry: mockRegistry,
          executor: mockExecutor,
          governanceGate: mockGovernanceGate,
          promptLoader: mockPromptLoader,
          checkpointHandler: mockCheckpointHandler,
        }
      );

      expect(result.success).toBe(true);
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].allowed).toBe(true);
    });

    it("should reject and inform agent on denial", async () => {
      // Create checkpoint handler that rejects
      const mockCheckpointHandler = new CheckpointHandler({
        requireApproval: true,
        autoApprove: false,
        approvalTimeoutMs: SHORT_TIMEOUT_MS, // Short timeout
      });

      // Mock requestApproval to return rejection
      vi.spyOn(mockCheckpointHandler, "requestApproval").mockResolvedValue({
        approved: false,
        reason: "rejected",
      });

      const provider = createMockProvider([
        {
          content: "",
          toolCalls: [
            { id: "call-1", name: "task_complete", arguments: { taskId: "001" } },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Understood, action was rejected.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider,
          workspaceRoot: testWorkspace,
        },
        {
          registry: mockRegistry,
          executor: mockExecutor,
          governanceGate: mockGovernanceGate,
          promptLoader: mockPromptLoader,
          checkpointHandler: mockCheckpointHandler,
        }
      );

      expect(result.success).toBe(true);
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].allowed).toBe(false);
      expect(result.toolCalls[0].denialReason).toContain("rejected");
    });

    it("should handle approval timeout gracefully", async () => {
      // Create checkpoint handler with very short timeout
      const mockCheckpointHandler = new CheckpointHandler({
        requireApproval: true,
        autoApprove: false,
        approvalTimeoutMs: 10,
      });

      // Mock requestApproval to return timeout
      vi.spyOn(mockCheckpointHandler, "requestApproval").mockImplementation(async () => {
        // Simulate timeout behavior
        (mockCheckpointHandler as unknown as { isPaused: boolean }).isPaused = true;
        return { approved: false, reason: "timeout" } as ApprovalResult;
      });

      // Mock the paused getter
      Object.defineProperty(mockCheckpointHandler, "paused", {
        get: () => true,
      });

      const provider = createMockProvider([
        {
          content: "",
          toolCalls: [
            { id: "call-1", name: "task_complete", arguments: { taskId: "001" } },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider,
          workspaceRoot: testWorkspace,
        },
        {
          registry: mockRegistry,
          executor: mockExecutor,
          governanceGate: mockGovernanceGate,
          promptLoader: mockPromptLoader,
          checkpointHandler: mockCheckpointHandler,
        }
      );

      expect(result.success).toBe(false);
      expect(result.stopReason).toBe("paused");
      expect(result.error).toContain("approval timeout");
    });
  });

  describe("Error Recovery", () => {
    it("should retry transient errors with backoff", async () => {
      const FAIL_COUNT = 2;
      const provider = createFailingThenSucceedingProvider(FAIL_COUNT, "rate_limit", {
        content: "Success after retries.",
        toolCalls: [],
        stopReason: "end_turn",
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      const result = await runAgentSession(
        {
          role: "impl",
          provider,
          workspaceRoot: testWorkspace,
          retryConfig: {
            enabled: true,
            maxRetries: 3,
            baseDelayMs: 10, // Short delay for tests
            maxDelayMs: 50,
          },
        },
        {
          registry: mockRegistry,
          executor: mockExecutor,
          governanceGate: mockGovernanceGate,
          promptLoader: mockPromptLoader,
        }
      );

      expect(result.success).toBe(true);
      // Provider should have been called 3 times (2 failures + 1 success)
      expect(provider.chat).toHaveBeenCalledTimes(3);
    });

    it("should not retry permanent errors", async () => {
      // Provider that throws provider-specific error
      const provider: LLMProvider = {
        name: "anthropic" as ProviderName,
        model: "mock-model",
        chat: vi.fn(async () => {
          const error = new Error("Invalid API key") as RetryableError;
          error.status = HttpStatus.UNAUTHORIZED; // Unauthorized - not retryable
          throw error;
        }),
      };

      const result = await runAgentSession(
        {
          role: "impl",
          provider,
          workspaceRoot: testWorkspace,
          retryConfig: {
            enabled: true,
            maxRetries: 3,
            baseDelayMs: 10,
            maxDelayMs: 50,
          },
        },
        {
          registry: mockRegistry,
          executor: mockExecutor,
          governanceGate: mockGovernanceGate,
          promptLoader: mockPromptLoader,
        }
      );

      expect(result.success).toBe(false);
      expect(result.stopReason).toBe("error");
      // Should only be called once since error is not retryable
      expect(provider.chat).toHaveBeenCalledTimes(1);
    });

    it("should fail after exhausting retries", async () => {
      const MAX_RETRIES = 3;
      // Provider always fails with retryable error
      const provider: LLMProvider = {
        name: "anthropic" as ProviderName,
        model: "mock-model",
        chat: vi.fn(async () => {
          const error = new Error("Rate limit exceeded") as RetryableError;
          error.status = HttpStatus.TOO_MANY_REQUESTS;
          throw error;
        }),
      };

      const result = await runAgentSession(
        {
          role: "impl",
          provider,
          workspaceRoot: testWorkspace,
          retryConfig: {
            enabled: true,
            maxRetries: MAX_RETRIES,
            baseDelayMs: 10,
            maxDelayMs: 50,
          },
        },
        {
          registry: mockRegistry,
          executor: mockExecutor,
          governanceGate: mockGovernanceGate,
          promptLoader: mockPromptLoader,
        }
      );

      expect(result.success).toBe(false);
      expect(result.stopReason).toBe("error");
      expect(result.error).toContain("Rate limit");
      // Should be called maxRetries + 1 times (initial + retries)
      expect(provider.chat).toHaveBeenCalledTimes(MAX_RETRIES + 1);
    });
  });

  describe("Provider Switching", () => {
    it("should work with different mock providers", async () => {
      // Test with first provider
      const provider1 = createMockProvider([
        {
          content: "Response from provider 1",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
      ]);

      const result1 = await runAgentSession(
        {
          role: "impl",
          provider: provider1,
          workspaceRoot: testWorkspace,
        },
        {
          registry: mockRegistry,
          executor: mockExecutor,
          governanceGate: mockGovernanceGate,
          promptLoader: mockPromptLoader,
        }
      );

      expect(result1.success).toBe(true);

      // Test with second provider (different model)
      const provider2: LLMProvider = {
        name: "openai" as ProviderName,
        model: "alternative-model",
        chat: vi.fn(async (): Promise<ChatResponse> => ({
          content: "Response from provider 2",
          toolCalls: [],
          stopReason: "end_turn" as StopReason,
          usage: { inputTokens: 200, outputTokens: 100 },
        })),
      };

      const result2 = await runAgentSession(
        {
          role: "impl",
          provider: provider2,
          workspaceRoot: testWorkspace,
        },
        {
          registry: mockRegistry,
          executor: mockExecutor,
          governanceGate: mockGovernanceGate,
          promptLoader: mockPromptLoader,
        }
      );

      expect(result2.success).toBe(true);
      expect(result2.tokensUsed.input).toBe(TEST_INPUT_TOKENS_200);
      expect(result2.tokensUsed.output).toBe(TEST_OUTPUT_TOKENS_100);
    });

    it("should handle provider-specific errors appropriately", async () => {
      // Provider that throws provider-specific error
      const provider: LLMProvider = {
        name: "anthropic" as ProviderName,
        model: "custom-model",
        chat: vi.fn(async () => {
          throw new Error("Custom provider: model not available");
        }),
      };

      const result = await runAgentSession(
        {
          role: "impl",
          provider,
          workspaceRoot: testWorkspace,
          retryConfig: { enabled: false },
        },
        {
          registry: mockRegistry,
          executor: mockExecutor,
          governanceGate: mockGovernanceGate,
          promptLoader: mockPromptLoader,
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Custom provider");
    });
  });

  describe("Graceful Shutdown", () => {
    it("should save session state on shutdown", async () => {
      const session = new Session({
        role: "impl",
        model: "mock-model",
        chainId: "CHAIN-TEST",
        taskId: "001",
        workspaceRoot: testWorkspace,
      });

      // Add some state
      session.addMessage({ role: "system", content: "Test prompt" });
      session.updateTokenUsage(100, 50);

      // First save the initial state
      await session.save();

      // Verify initial save worked
      const initialLoad = await Session.load(session.id, testWorkspace);
      expect(initialLoad).not.toBeNull();
      expect(initialLoad!.status).toBe("running");

      // Now simulate shutdown by setting status to paused (auto-saves)
      await session.setStatus("paused");

      // Verify session was saved with paused status
      const loaded = await Session.load(session.id, testWorkspace);
      expect(loaded).not.toBeNull();
      expect(loaded!.status).toBe("paused");
      expect(loaded!.messages).toHaveLength(1);
    });

    it("should track shutdown state correctly", () => {
      const handler = new ShutdownHandler();

      expect(handler.shouldStop()).toBe(false);
      expect(handler.isForced()).toBe(false);

      // Simulate state changes
      handler.setCurrentTurn(Promise.resolve());
      expect(handler.getState().currentTurnPromise).not.toBeNull();

      handler.clearCurrentTurn();
      expect(handler.getState().currentTurnPromise).toBeNull();

      handler.reset();
      expect(handler.shouldStop()).toBe(false);
    });
  });

  describe("End-to-End Scenarios", () => {
    it("should complete a full session with tool calls and cost tracking", async () => {
      const provider = createMockProvider([
        {
          content: "I will use the test tool.",
          toolCalls: [
            { id: "call-1", name: "test:allowed", arguments: { param: "value" } },
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Tool executed successfully. Task complete.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 150, outputTokens: 75 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl",
          provider,
          workspaceRoot: testWorkspace,
          chainId: "CHAIN-E2E",
          taskId: "001",
        },
        {
          registry: mockRegistry,
          executor: mockExecutor,
          governanceGate: mockGovernanceGate,
          promptLoader: mockPromptLoader,
        }
      );

      expect(result.success).toBe(true);
      expect(result.iterations).toBe(2);
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe("test:allowed");
      expect(result.toolCalls[0].allowed).toBe(true);
      expect(result.tokensUsed.input).toBe(250);
      expect(result.tokensUsed.output).toBe(125);
      expect(result.costSnapshot).toBeDefined();
    });

    it("should handle governance denial and continue gracefully", async () => {
      // Create registry with restricted tool
      const restrictedTools: ToolDefinition[] = [
        {
          name: "control:only",
          description: "Control-only tool",
          parameters: { type: "object", properties: {} },
          allowedRoles: ["control"],
        },
        {
          name: "test:allowed",
          description: "Allowed tool",
          parameters: { type: "object", properties: {} },
          allowedRoles: ["control", "impl"],
        },
      ];
      const restrictedRegistry = new ToolRegistry(restrictedTools);
      const restrictedGate = new GovernanceGate(restrictedRegistry);

      const provider = createMockProvider([
        {
          content: "",
          toolCalls: [
            { id: "call-1", name: "control:only", arguments: {} }, // Will be denied
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "",
          toolCalls: [
            { id: "call-2", name: "test:allowed", arguments: {} }, // Will succeed
          ],
          stopReason: "tool_use",
          usage: { inputTokens: 100, outputTokens: 50 },
        },
        {
          content: "Completed with allowed tool.",
          toolCalls: [],
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 25 },
        },
      ]);

      const result = await runAgentSession(
        {
          role: "impl", // impl role cannot use control:only
          provider,
          workspaceRoot: testWorkspace,
        },
        {
          registry: restrictedRegistry,
          executor: mockExecutor,
          governanceGate: restrictedGate,
          promptLoader: mockPromptLoader,
        }
      );

      expect(result.success).toBe(true);
      expect(result.toolCalls).toHaveLength(2);
      expect(result.toolCalls[0].allowed).toBe(false);
      expect(result.toolCalls[0].denialReason).toContain("not available");
      expect(result.toolCalls[1].allowed).toBe(true);
    });

    it("should combine retry, cost tracking, and session persistence", async () => {
      const FAIL_COUNT = 1;
      const provider = createFailingThenSucceedingProvider(FAIL_COUNT, "timeout", {
        content: "Success after retry.",
        toolCalls: [],
        stopReason: "end_turn",
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      const result = await runAgentSession(
        {
          role: "impl",
          provider,
          workspaceRoot: testWorkspace,
          maxTokens: 10000, // Set a limit to enable cost tracking
          retryConfig: {
            enabled: true,
            maxRetries: 3,
            baseDelayMs: 10,
            maxDelayMs: 50,
          },
        },
        {
          registry: mockRegistry,
          executor: mockExecutor,
          governanceGate: mockGovernanceGate,
          promptLoader: mockPromptLoader,
        }
      );

      expect(result.success).toBe(true);
      expect(result.costSnapshot).toBeDefined();
      expect(result.costSnapshot!.tokens.total).toBe(150);
      expect(provider.chat).toHaveBeenCalledTimes(2); // 1 failure + 1 success
    });
  });
});
