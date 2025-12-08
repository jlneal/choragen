/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify LLM provider abstraction layer correctly normalizes Anthropic, OpenAI, and Gemini APIs"
 * @test-type unit
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Message, Tool } from "../runtime/providers/index.js";
import {
  createProvider,
  createProviderFromEnv,
  getApiKeyFromEnv,
  getProviderFromEnv,
  ProviderError,
  DEFAULT_MODELS,
  DEFAULT_MAX_TOKENS,
} from "../runtime/providers/index.js";

// Mock the SDK modules
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: "text", text: "Hello from Claude" }],
          stop_reason: "end_turn",
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      },
    })),
  };
});

vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: { content: "Hello from GPT", tool_calls: undefined },
                finish_reason: "stop",
              },
            ],
            usage: { prompt_tokens: 10, completion_tokens: 5 },
          }),
        },
      },
    })),
  };
});

vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: vi.fn().mockResolvedValue({
          response: {
            candidates: [
              {
                content: { parts: [{ text: "Hello from Gemini" }] },
                finishReason: "STOP",
              },
            ],
            usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
          },
        }),
      }),
    })),
  };
});

describe("LLM Provider Types", () => {
  it("exports DEFAULT_MODELS for all providers", () => {
    expect(DEFAULT_MODELS.anthropic).toBe("claude-sonnet-4-20250514");
    expect(DEFAULT_MODELS.openai).toBe("gpt-4o");
    expect(DEFAULT_MODELS.gemini).toBe("gemini-2.0-flash");
  });

  it("exports DEFAULT_MAX_TOKENS", () => {
    const EXPECTED_DEFAULT_MAX_TOKENS = 4096;
    expect(DEFAULT_MAX_TOKENS).toBe(EXPECTED_DEFAULT_MAX_TOKENS);
  });
});

describe("createProvider", () => {
  it("creates AnthropicProvider", () => {
    const provider = createProvider("anthropic", { apiKey: "test-key" });
    expect(provider.name).toBe("anthropic");
    expect(provider.model).toBe(DEFAULT_MODELS.anthropic);
  });

  it("creates OpenAIProvider", () => {
    const provider = createProvider("openai", { apiKey: "test-key" });
    expect(provider.name).toBe("openai");
    expect(provider.model).toBe(DEFAULT_MODELS.openai);
  });

  it("creates GeminiProvider", () => {
    const provider = createProvider("gemini", { apiKey: "test-key" });
    expect(provider.name).toBe("gemini");
    expect(provider.model).toBe(DEFAULT_MODELS.gemini);
  });

  it("uses custom model when provided", () => {
    const provider = createProvider("anthropic", {
      apiKey: "test-key",
      model: "claude-3-5-haiku-20241022",
    });
    expect(provider.model).toBe("claude-3-5-haiku-20241022");
  });

  it("throws ProviderError when API key is missing", () => {
    expect(() => createProvider("anthropic", { apiKey: "" })).toThrow(
      ProviderError
    );
    expect(() => createProvider("anthropic", { apiKey: "" })).toThrow(
      /API key is required/
    );
  });
});

describe("Environment variable helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getApiKeyFromEnv", () => {
    it("returns ANTHROPIC_API_KEY for anthropic", () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-test";
      expect(getApiKeyFromEnv("anthropic")).toBe("sk-ant-test");
    });

    it("returns OPENAI_API_KEY for openai", () => {
      process.env.OPENAI_API_KEY = "sk-openai-test";
      expect(getApiKeyFromEnv("openai")).toBe("sk-openai-test");
    });

    it("returns GEMINI_API_KEY for gemini", () => {
      process.env.GEMINI_API_KEY = "gemini-test";
      expect(getApiKeyFromEnv("gemini")).toBe("gemini-test");
    });

    it("returns undefined when env var is not set", () => {
      delete process.env.ANTHROPIC_API_KEY;
      expect(getApiKeyFromEnv("anthropic")).toBeUndefined();
    });
  });

  describe("getProviderFromEnv", () => {
    it("returns provider from CHORAGEN_PROVIDER", () => {
      process.env.CHORAGEN_PROVIDER = "openai";
      expect(getProviderFromEnv()).toBe("openai");
    });

    it("returns undefined for invalid provider", () => {
      process.env.CHORAGEN_PROVIDER = "invalid";
      expect(getProviderFromEnv()).toBeUndefined();
    });

    it("returns undefined when not set", () => {
      delete process.env.CHORAGEN_PROVIDER;
      expect(getProviderFromEnv()).toBeUndefined();
    });
  });

  describe("createProviderFromEnv", () => {
    it("creates provider from environment", () => {
      process.env.CHORAGEN_PROVIDER = "openai";
      process.env.OPENAI_API_KEY = "sk-test";

      const provider = createProviderFromEnv();
      expect(provider.name).toBe("openai");
    });

    it("defaults to anthropic when CHORAGEN_PROVIDER not set", () => {
      delete process.env.CHORAGEN_PROVIDER;
      process.env.ANTHROPIC_API_KEY = "sk-ant-test";

      const provider = createProviderFromEnv();
      expect(provider.name).toBe("anthropic");
    });

    it("throws when API key not set", () => {
      process.env.CHORAGEN_PROVIDER = "openai";
      delete process.env.OPENAI_API_KEY;

      expect(() => createProviderFromEnv()).toThrow(ProviderError);
      expect(() => createProviderFromEnv()).toThrow(/OPENAI_API_KEY/);
    });

    it("applies overrides", () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-test";

      const provider = createProviderFromEnv({ model: "claude-3-5-haiku-20241022" });
      expect(provider.model).toBe("claude-3-5-haiku-20241022");
    });
  });
});

describe("AnthropicProvider", () => {
  it("calls chat and returns normalized response", async () => {
    const provider = createProvider("anthropic", { apiKey: "test-key" });

    const messages: Message[] = [
      { role: "system", content: "You are helpful." },
      { role: "user", content: "Hello" },
    ];
    const tools: Tool[] = [];

    const response = await provider.chat(messages, tools);

    expect(response.content).toBe("Hello from Claude");
    expect(response.stopReason).toBe("end_turn");
    expect(response.toolCalls).toEqual([]);
    expect(response.usage.inputTokens).toBe(10);
    expect(response.usage.outputTokens).toBe(5);
  });
});

describe("OpenAIProvider", () => {
  it("calls chat and returns normalized response", async () => {
    const provider = createProvider("openai", { apiKey: "test-key" });

    const messages: Message[] = [
      { role: "system", content: "You are helpful." },
      { role: "user", content: "Hello" },
    ];
    const tools: Tool[] = [];

    const response = await provider.chat(messages, tools);

    expect(response.content).toBe("Hello from GPT");
    expect(response.stopReason).toBe("end_turn");
    expect(response.toolCalls).toEqual([]);
    expect(response.usage.inputTokens).toBe(10);
    expect(response.usage.outputTokens).toBe(5);
  });
});

describe("GeminiProvider", () => {
  it("calls chat and returns normalized response", async () => {
    const provider = createProvider("gemini", { apiKey: "test-key" });

    const messages: Message[] = [
      { role: "system", content: "You are helpful." },
      { role: "user", content: "Hello" },
    ];
    const tools: Tool[] = [];

    const response = await provider.chat(messages, tools);

    expect(response.content).toBe("Hello from Gemini");
    expect(response.stopReason).toBe("end_turn");
    expect(response.toolCalls).toEqual([]);
    expect(response.usage.inputTokens).toBe(10);
    expect(response.usage.outputTokens).toBe(5);
  });
});

describe("Tool handling", () => {
  it("formats tools correctly for Anthropic", async () => {
    const AnthropicModule = await import("@anthropic-ai/sdk");
    const mockCreate = vi.fn().mockResolvedValue({
      content: [
        {
          type: "tool_use",
          id: "tool-1",
          name: "read_file",
          input: { path: "/test.txt" },
        },
      ],
      stop_reason: "tool_use",
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    vi.mocked(AnthropicModule.default).mockImplementation(
      () =>
        ({
          messages: { create: mockCreate },
        }) as unknown as InstanceType<typeof AnthropicModule.default>
    );

    const provider = createProvider("anthropic", { apiKey: "test-key" });

    const tools: Tool[] = [
      {
        name: "read_file",
        description: "Read a file",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path" },
          },
          required: ["path"],
        },
      },
    ];

    const response = await provider.chat(
      [{ role: "user", content: "Read test.txt" }],
      tools
    );

    expect(response.stopReason).toBe("tool_use");
    expect(response.toolCalls).toHaveLength(1);
    expect(response.toolCalls[0].name).toBe("read_file");
    expect(response.toolCalls[0].arguments).toEqual({ path: "/test.txt" });
  });
});
