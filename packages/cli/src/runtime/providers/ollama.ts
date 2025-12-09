// ADR: ADR-010-agent-runtime-architecture

/**
 * Ollama local LLM provider implementation.
 * Enables offline/private agent sessions via local Ollama server.
 */

import type {
  LLMProvider,
  Message,
  Tool,
  ChatResponse,
  StopReason,
  ToolCall,
} from "./types.js";
import { DEFAULT_MAX_TOKENS } from "./types.js";

/**
 * Default Ollama server host.
 */
export const DEFAULT_OLLAMA_HOST = "http://localhost:11434";

/**
 * Default Ollama model.
 */
export const DEFAULT_OLLAMA_MODEL = "llama2";

/**
 * Models known to support native tool/function calling.
 */
const TOOL_CAPABLE_MODELS = new Set([
  "llama3.1",
  "llama3.2",
  "llama3.3",
  "mistral",
  "mixtral",
  "qwen2.5",
  "qwen2",
  "command-r",
  "command-r-plus",
]);

/**
 * Ollama-specific configuration.
 */
export interface OllamaConfig {
  host?: string;
  model?: string;
  maxTokens?: number;
}

/**
 * Ollama chat request format.
 */
interface OllamaChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream: boolean;
  tools?: OllamaTool[];
  options?: {
    num_predict?: number;
  };
}

/**
 * Ollama tool format.
 */
interface OllamaTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

/**
 * Ollama tool call format.
 */
interface OllamaToolCall {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

/**
 * Ollama chat response format.
 */
interface OllamaChatResponse {
  message: {
    role: string;
    content: string;
    tool_calls?: OllamaToolCall[];
  };
  done: boolean;
  total_duration?: number;
  eval_count?: number;
  prompt_eval_count?: number;
}

/**
 * Error thrown when Ollama server is not available.
 */
export class OllamaConnectionError extends Error {
  constructor(host: string, cause?: Error) {
    super(
      `Cannot connect to Ollama server at ${host}. ` +
        `Ensure Ollama is running with 'ollama serve'. ` +
        (cause ? `Cause: ${cause.message}` : "")
    );
    this.name = "OllamaConnectionError";
  }
}

/**
 * Check if a model name indicates tool support.
 */
function hasNativeToolSupport(model: string): boolean {
  const normalizedModel = model.toLowerCase();
  for (const capable of TOOL_CAPABLE_MODELS) {
    if (normalizedModel.includes(capable)) {
      return true;
    }
  }
  return false;
}

/**
 * Format tools as a prompt string for models without native tool support.
 */
function formatToolsAsPrompt(tools: Tool[]): string {
  if (tools.length === 0) {
    return "";
  }

  const toolDescriptions = tools.map((t) => {
    const params = JSON.stringify(t.parameters, null, 2);
    return `- ${t.name}: ${t.description}\n  Parameters: ${params}`;
  });

  return (
    "\n\nYou have access to the following tools:\n" +
    toolDescriptions.join("\n\n") +
    "\n\nTo use a tool, respond with a JSON object in this format:\n" +
    '{"tool_call": {"name": "<tool_name>", "arguments": {<arguments>}}}\n' +
    "Only use one tool at a time. If you don't need to use a tool, respond normally."
  );
}

/**
 * Parse tool calls from model response text (for models without native tool support).
 */
function parseToolCallsFromText(content: string): ToolCall[] {
  const toolCalls: ToolCall[] = [];

  // Look for JSON tool call patterns - find potential JSON objects starting with {"tool_call"
  const startPattern = /\{"tool_call"\s*:/g;
  const matches: string[] = [];
  
  let match;
  while ((match = startPattern.exec(content)) !== null) {
    // Try to extract a valid JSON object starting at this position
    const startIndex = match.index;
    let braceCount = 0;
    let endIndex = startIndex;
    
    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === "{") braceCount++;
      if (content[i] === "}") braceCount--;
      if (braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
    
    if (endIndex > startIndex) {
      matches.push(content.slice(startIndex, endIndex));
    }
  }

  if (matches) {
    for (const match of matches) {
      try {
        const parsed = JSON.parse(match) as {
          tool_call: { name: string; arguments: Record<string, unknown> };
        };
        if (parsed.tool_call?.name) {
          toolCalls.push({
            id: `ollama-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            name: parsed.tool_call.name,
            arguments: parsed.tool_call.arguments ?? {},
          });
        }
      } catch {
        // Skip malformed JSON
      }
    }
  }

  return toolCalls;
}

/**
 * Remove tool call JSON from content text.
 */
function removeToolCallJson(content: string): string {
  const startPattern = /\{"tool_call"\s*:/g;
  let result = content;
  
  let match;
  while ((match = startPattern.exec(content)) !== null) {
    const startIndex = match.index;
    let braceCount = 0;
    let endIndex = startIndex;
    
    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === "{") braceCount++;
      if (content[i] === "}") braceCount--;
      if (braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
    
    if (endIndex > startIndex) {
      const jsonToRemove = content.slice(startIndex, endIndex);
      result = result.replace(jsonToRemove, "");
    }
  }
  
  return result.trim();
}

/**
 * Map our message format to Ollama's format.
 */
function toOllamaMessages(
  messages: Message[],
  tools: Tool[],
  useNativeTools: boolean
): Array<{ role: string; content: string }> {
  const result: Array<{ role: string; content: string }> = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      let content = msg.content;
      // Append tool descriptions for models without native support
      if (!useNativeTools && tools.length > 0) {
        content += formatToolsAsPrompt(tools);
      }
      result.push({ role: "system", content });
    } else if (msg.role === "tool") {
      // Format tool results as user messages
      result.push({
        role: "user",
        content: `Tool result for ${msg.toolName ?? "unknown"}: ${msg.content}`,
      });
    } else if (msg.role === "user") {
      result.push({ role: "user", content: msg.content });
    } else if (msg.role === "assistant") {
      result.push({ role: "assistant", content: msg.content });
    }
  }

  return result;
}

/**
 * Map our tool format to Ollama's format.
 */
function toOllamaTools(tools: Tool[]): OllamaTool[] {
  return tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: tool.parameters.properties,
        required: tool.parameters.required,
      },
    },
  }));
}

/**
 * Extract tool calls from Ollama response.
 */
function extractToolCalls(toolCalls: OllamaToolCall[] | undefined): ToolCall[] {
  if (!toolCalls || toolCalls.length === 0) {
    return [];
  }

  return toolCalls.map((tc, index) => ({
    id: `ollama-${Date.now()}-${index}`,
    name: tc.function.name,
    arguments: tc.function.arguments,
  }));
}

/**
 * Determine stop reason from response.
 */
function determineStopReason(
  response: OllamaChatResponse,
  toolCalls: ToolCall[]
): StopReason {
  if (toolCalls.length > 0) {
    return "tool_use";
  }
  return "end_turn";
}

/**
 * Ollama local LLM provider.
 */
export class OllamaProvider implements LLMProvider {
  readonly name = "ollama" as const;
  readonly model: string;

  private host: string;
  private maxTokens: number;
  private useNativeTools: boolean;

  constructor(config: OllamaConfig = {}) {
    this.host = config.host ?? process.env.OLLAMA_HOST ?? DEFAULT_OLLAMA_HOST;
    this.model = config.model ?? process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
    this.maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.useNativeTools = hasNativeToolSupport(this.model);
  }

  async chat(messages: Message[], tools: Tool[]): Promise<ChatResponse> {
    const ollamaMessages = toOllamaMessages(messages, tools, this.useNativeTools);

    const requestBody: OllamaChatRequest = {
      model: this.model,
      messages: ollamaMessages,
      stream: false,
      options: {
        num_predict: this.maxTokens,
      },
    };

    // Only include tools for models with native support
    if (this.useNativeTools && tools.length > 0) {
      requestBody.tools = toOllamaTools(tools);
    }

    let response: Response;
    try {
      response = await fetch(`${this.host}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
    } catch (err) {
      throw new OllamaConnectionError(
        this.host,
        err instanceof Error ? err : undefined
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as OllamaChatResponse;

    // Extract tool calls - either from native response or by parsing text
    let toolCalls: ToolCall[];
    if (this.useNativeTools) {
      toolCalls = extractToolCalls(data.message.tool_calls);
    } else {
      toolCalls = parseToolCallsFromText(data.message.content);
    }

    const stopReason = determineStopReason(data, toolCalls);

    // Clean content if we parsed tool calls from it
    let content = data.message.content;
    if (!this.useNativeTools && toolCalls.length > 0) {
      // Remove the tool call JSON from the content using the same brace-matching approach
      content = removeToolCallJson(content);
    }

    return {
      content,
      toolCalls,
      stopReason,
      usage: {
        inputTokens: data.prompt_eval_count ?? 0,
        outputTokens: data.eval_count ?? 0,
      },
    };
  }
}

/**
 * Check if Ollama server is available.
 * @param host - Ollama server host (default: from env or localhost:11434)
 * @returns true if server is reachable
 */
export async function isOllamaAvailable(host?: string): Promise<boolean> {
  const ollamaHost = host ?? process.env.OLLAMA_HOST ?? DEFAULT_OLLAMA_HOST;

  try {
    const response = await fetch(`${ollamaHost}/api/tags`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get list of available models from Ollama server.
 * @param host - Ollama server host (default: from env or localhost:11434)
 * @returns Array of model names
 */
export async function getOllamaModels(host?: string): Promise<string[]> {
  const ollamaHost = host ?? process.env.OLLAMA_HOST ?? DEFAULT_OLLAMA_HOST;

  try {
    const response = await fetch(`${ollamaHost}/api/tags`, {
      method: "GET",
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as {
      models?: Array<{ name: string }>;
    };

    return data.models?.map((m) => m.name) ?? [];
  } catch {
    return [];
  }
}
