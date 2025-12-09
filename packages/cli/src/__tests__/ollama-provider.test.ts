/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify Ollama provider correctly implements LLMProvider interface for local LLM inference"
 * @test-type unit
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Message, Tool } from "../runtime/providers/index.js";
import {
  createProvider,
  getApiKeyFromEnv,
  DEFAULT_MODELS,
} from "../runtime/providers/index.js";
import {
  OllamaProvider,
  OllamaConnectionError,
  isOllamaAvailable,
  getOllamaModels,
  DEFAULT_OLLAMA_HOST,
  DEFAULT_OLLAMA_MODEL,
} from "../runtime/providers/ollama.js";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Ollama Provider Constants", () => {
  it("exports DEFAULT_OLLAMA_HOST", () => {
    expect(DEFAULT_OLLAMA_HOST).toBe("http://localhost:11434");
  });

  it("exports DEFAULT_OLLAMA_MODEL", () => {
    expect(DEFAULT_OLLAMA_MODEL).toBe("llama2");
  });

  it("has ollama in DEFAULT_MODELS", () => {
    expect(DEFAULT_MODELS.ollama).toBe("llama2");
  });
});

describe("OllamaProvider", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.OLLAMA_HOST;
    delete process.env.OLLAMA_MODEL;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("constructor", () => {
    it("uses default host and model when not configured", () => {
      const provider = new OllamaProvider();
      expect(provider.name).toBe("ollama");
      expect(provider.model).toBe("llama2");
    });

    it("uses OLLAMA_HOST env var", () => {
      process.env.OLLAMA_HOST = "http://custom:8080";
      const provider = new OllamaProvider();
      expect(provider.model).toBe("llama2");
    });

    it("uses OLLAMA_MODEL env var", () => {
      process.env.OLLAMA_MODEL = "llama3.2";
      const provider = new OllamaProvider();
      expect(provider.model).toBe("llama3.2");
    });

    it("uses config over env vars", () => {
      process.env.OLLAMA_MODEL = "llama2";
      const provider = new OllamaProvider({ model: "mistral" });
      expect(provider.model).toBe("mistral");
    });
  });

  describe("chat", () => {
    it("sends correct request format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            message: { role: "assistant", content: "Hello from Ollama" },
            done: true,
            prompt_eval_count: 10,
            eval_count: 5,
          }),
      });

      const provider = new OllamaProvider({ model: "llama2" });
      const messages: Message[] = [
        { role: "system", content: "You are helpful." },
        { role: "user", content: "Hello" },
      ];

      await provider.chat(messages, []);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:11434/api/chat",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.any(String),
        })
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe("llama2");
      expect(requestBody.stream).toBe(false);
      expect(requestBody.messages).toHaveLength(2);
    });

    it("returns normalized response", async () => {
      const INPUT_TOKENS = 10;
      const OUTPUT_TOKENS = 5;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            message: { role: "assistant", content: "Hello from Ollama" },
            done: true,
            prompt_eval_count: INPUT_TOKENS,
            eval_count: OUTPUT_TOKENS,
          }),
      });

      const provider = new OllamaProvider();
      const response = await provider.chat(
        [{ role: "user", content: "Hello" }],
        []
      );

      expect(response.content).toBe("Hello from Ollama");
      expect(response.stopReason).toBe("end_turn");
      expect(response.toolCalls).toEqual([]);
      expect(response.usage.inputTokens).toBe(INPUT_TOKENS);
      expect(response.usage.outputTokens).toBe(OUTPUT_TOKENS);
    });

    it("handles native tool calls for supported models", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            message: {
              role: "assistant",
              content: "",
              tool_calls: [
                {
                  function: {
                    name: "read_file",
                    arguments: { path: "/test.txt" },
                  },
                },
              ],
            },
            done: true,
            prompt_eval_count: 10,
            eval_count: 5,
          }),
      });

      // llama3.2 supports native tools
      const provider = new OllamaProvider({ model: "llama3.2" });
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

    it("parses tool calls from text for unsupported models", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            message: {
              role: "assistant",
              content:
                'I will read that file for you. {"tool_call": {"name": "read_file", "arguments": {"path": "/test.txt"}}}',
            },
            done: true,
            prompt_eval_count: 10,
            eval_count: 5,
          }),
      });

      // llama2 doesn't support native tools
      const provider = new OllamaProvider({ model: "llama2" });
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
      // Content should have the tool call JSON removed
      expect(response.content).toBe("I will read that file for you.");
    });

    it("throws OllamaConnectionError when server is not available", async () => {
      mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

      const provider = new OllamaProvider();

      await expect(
        provider.chat([{ role: "user", content: "Hello" }], [])
      ).rejects.toThrow(OllamaConnectionError);
    });

    it("throws error on non-ok response", async () => {
      const ERROR_STATUS = 500;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: ERROR_STATUS,
        text: () => Promise.resolve("Internal server error"),
      });

      const provider = new OllamaProvider();

      await expect(
        provider.chat([{ role: "user", content: "Hello" }], [])
      ).rejects.toThrow("Ollama API error (500)");
    });

    it("handles tool results in messages", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            message: { role: "assistant", content: "The file contains: test" },
            done: true,
            prompt_eval_count: 15,
            eval_count: 8,
          }),
      });

      const provider = new OllamaProvider();
      const messages: Message[] = [
        { role: "user", content: "Read test.txt" },
        {
          role: "tool",
          content: "test content",
          toolCallId: "call-1",
          toolName: "read_file",
        },
      ];

      await provider.chat(messages, []);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.messages).toHaveLength(2);
      expect(requestBody.messages[1].role).toBe("user");
      expect(requestBody.messages[1].content).toContain("Tool result");
    });
  });
});

describe("createProvider with ollama", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates OllamaProvider", () => {
    const provider = createProvider("ollama", { apiKey: "ollama" });
    expect(provider.name).toBe("ollama");
    expect(provider.model).toBe(DEFAULT_MODELS.ollama);
  });

  it("creates OllamaProvider with custom model", () => {
    const provider = createProvider("ollama", {
      apiKey: "ollama",
      model: "llama3.2",
    });
    expect(provider.model).toBe("llama3.2");
  });

  it("does not require API key for ollama", () => {
    // Should not throw even with empty apiKey
    const provider = createProvider("ollama", { apiKey: "" });
    expect(provider.name).toBe("ollama");
  });
});

describe("getApiKeyFromEnv with ollama", () => {
  it("returns 'ollama' placeholder for ollama provider", () => {
    expect(getApiKeyFromEnv("ollama")).toBe("ollama");
  });
});

describe("isOllamaAvailable", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns true when server responds ok", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const result = await isOllamaAvailable();
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:11434/api/tags",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("returns false when server responds with error", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await isOllamaAvailable();
    expect(result).toBe(false);
  });

  it("returns false when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const result = await isOllamaAvailable();
    expect(result).toBe(false);
  });

  it("uses custom host", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await isOllamaAvailable("http://custom:8080");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://custom:8080/api/tags",
      expect.any(Object)
    );
  });
});

describe("getOllamaModels", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns list of model names", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          models: [{ name: "llama2" }, { name: "mistral" }, { name: "llama3.2" }],
        }),
    });

    const models = await getOllamaModels();
    expect(models).toEqual(["llama2", "mistral", "llama3.2"]);
  });

  it("returns empty array on error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const models = await getOllamaModels();
    expect(models).toEqual([]);
  });

  it("returns empty array when no models", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const models = await getOllamaModels();
    expect(models).toEqual([]);
  });
});

describe("Tool-capable model detection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          message: { role: "assistant", content: "test" },
          done: true,
        }),
    });
  });

  const toolCapableModels = [
    "llama3.1",
    "llama3.2",
    "llama3.3",
    "mistral",
    "mixtral",
    "qwen2.5",
    "qwen2",
    "command-r",
    "command-r-plus",
  ];

  for (const model of toolCapableModels) {
    it(`recognizes ${model} as tool-capable`, async () => {
      const provider = new OllamaProvider({ model });
      const tools: Tool[] = [
        {
          name: "test",
          description: "Test tool",
          parameters: { type: "object", properties: {} },
        },
      ];

      await provider.chat([{ role: "user", content: "test" }], tools);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      // Tool-capable models should have tools in the request
      expect(requestBody.tools).toBeDefined();
    });
  }

  it("does not send tools for non-capable models", async () => {
    const provider = new OllamaProvider({ model: "llama2" });
    const tools: Tool[] = [
      {
        name: "test",
        description: "Test tool",
        parameters: { type: "object", properties: {} },
      },
    ];

    await provider.chat([{ role: "user", content: "test" }], tools);

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    // Non-capable models should not have tools in request
    expect(requestBody.tools).toBeUndefined();
  });
});
