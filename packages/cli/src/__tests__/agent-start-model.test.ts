/**
 * @design-doc docs/design/core/features/specialized-agent-roles.md
 * @user-intent "Ensure agent:start uses role model configuration for provider/model/temperature"
 * @test-type unit
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

type RoleStub = {
  id: string;
  name: string;
  toolIds: string[];
  model?: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens?: number;
  };
  systemPrompt?: string;
};

const mockCreateProvider = vi.fn();
const mockRunAgentSession = vi.fn();
const defaultRole: RoleStub = {
  id: "implementation",
  name: "Implementation",
  toolIds: [],
  model: {
    provider: "openai",
    model: "gpt-4.1",
    temperature: 0.42,
  },
};

async function loadRunAgentStart(role: RoleStub | null) {
  vi.resetModules();

  vi.doMock("@choragen/core", () => ({
    MetricsCollector: class {},
    RoleManager: class {
      constructor(_root: string) {}
      async get() {
        return role;
      }
    },
  }));

  vi.doMock("../runtime/index.js", async () => {
    const Session = class {
      id = "session-test";
      updateTokenUsage() {}
      async end() {}
    };
    return {
      DEFAULT_MODELS: {
        anthropic: "claude-sonnet-4-20250514",
        openai: "gpt-4o",
        gemini: "gemini-2.0-flash",
        ollama: "llama2",
      },
      createProvider: mockCreateProvider,
      runAgentSession: mockRunAgentSession,
      getApiKeyFromEnv: () => "api-key",
      getProviderFromEnv: () => undefined,
      ProviderError: class extends Error {},
      Session,
      getCostLimitsFromEnv: () => ({ maxTokens: undefined, maxCost: undefined }),
      getApprovalTimeoutFromEnv: () => undefined,
      resolveRoleId: (roleName: string) =>
        roleName === "impl" ? "implementation" : "control",
    };
  });

  const module = await import("../commands/agent.js");
  return module.runAgentStart;
}

describe("agent:start role model configuration", () => {
  let workspaceRoot: string;

  beforeEach(async () => {
    workspaceRoot = await mkdtemp(join(tmpdir(), "choragen-agent-start-"));
    mockCreateProvider.mockReset();
    mockRunAgentSession.mockReset();
    vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    await rm(workspaceRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("uses role model provider, model, and temperature when available", async () => {
    mockCreateProvider.mockReturnValue({
      name: "openai",
      model: "gpt-4.1",
      chat: vi.fn(),
    });
    mockRunAgentSession.mockResolvedValue({
      success: true,
      iterations: 0,
      toolCalls: [],
      tokensUsed: { input: 0, output: 0 },
      stopReason: "end_turn",
      sessionId: "session-test",
    });

    const runAgentStart = await loadRunAgentStart(defaultRole);
    await runAgentStart(["--role=impl", "--dry-run"], workspaceRoot);

    expect(mockCreateProvider).toHaveBeenCalledWith("openai", {
      apiKey: "api-key",
      model: "gpt-4.1",
      temperature: 0.42,
    });
    expect(mockRunAgentSession).toHaveBeenCalled();
  });

  it("falls back to defaults when role has no model config", async () => {
    mockCreateProvider.mockReturnValue({
      name: "anthropic",
      model: "claude-sonnet-4-20250514",
      chat: vi.fn(),
    });
    mockRunAgentSession.mockResolvedValue({
      success: true,
      iterations: 0,
      toolCalls: [],
      tokensUsed: { input: 0, output: 0 },
      stopReason: "end_turn",
      sessionId: "session-test",
    });

    const runAgentStart = await loadRunAgentStart({
      ...defaultRole,
      model: undefined,
    });
    await runAgentStart(["--role=impl", "--dry-run"], workspaceRoot);

    expect(mockCreateProvider).toHaveBeenCalledWith("anthropic", {
      apiKey: "api-key",
      model: "claude-sonnet-4-20250514",
    });
    expect(mockRunAgentSession).toHaveBeenCalled();
  });
});
