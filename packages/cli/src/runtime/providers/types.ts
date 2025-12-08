// ADR: ADR-010-agent-runtime-architecture

/**
 * LLM Provider abstraction layer types.
 * Normalizes differences between Anthropic, OpenAI, and Gemini APIs.
 */

/**
 * Role of a message in the conversation.
 */
export type MessageRole = "system" | "user" | "assistant" | "tool";

/**
 * A message in the conversation history.
 */
export interface Message {
  role: MessageRole;
  content: string;
  /**
   * Tool call ID this message is responding to (for tool role messages).
   */
  toolCallId?: string;
  /**
   * Name of the tool being responded to (for tool role messages).
   */
  toolName?: string;
}

/**
 * JSON Schema definition for tool parameters.
 */
export interface ToolParameterSchema {
  type: "object";
  properties: Record<
    string,
    {
      type: string;
      description?: string;
      enum?: string[];
      items?: { type: string };
    }
  >;
  required?: string[];
}

/**
 * Tool definition that can be called by the LLM.
 */
export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
}

/**
 * A tool call made by the LLM.
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Reason the LLM stopped generating.
 */
export type StopReason = "end_turn" | "tool_use" | "max_tokens";

/**
 * Token usage statistics.
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Response from a chat completion.
 */
export interface ChatResponse {
  content: string;
  toolCalls: ToolCall[];
  stopReason: StopReason;
  usage: TokenUsage;
}

/**
 * Chunk of a streaming response (for future use).
 */
export interface StreamChunk {
  type: "text" | "tool_call_start" | "tool_call_delta" | "tool_call_end";
  content?: string;
  toolCall?: Partial<ToolCall>;
}

/**
 * Configuration for an LLM provider.
 */
export interface ProviderConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Supported LLM provider names.
 */
export type ProviderName = "anthropic" | "openai" | "gemini";

/**
 * Default models for each provider.
 */
export const DEFAULT_MODELS: Record<ProviderName, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  gemini: "gemini-2.0-flash",
};

/**
 * Default max tokens for responses.
 */
export const DEFAULT_MAX_TOKENS = 4096;

/**
 * LLM Provider interface.
 * Implementations normalize provider-specific APIs to this common interface.
 */
export interface LLMProvider {
  /**
   * The name of this provider.
   */
  readonly name: ProviderName;

  /**
   * The model being used.
   */
  readonly model: string;

  /**
   * Send a chat completion request.
   * @param messages - Conversation history
   * @param tools - Available tools for the LLM to call
   * @returns Chat response with content, tool calls, and usage
   */
  chat(messages: Message[], tools: Tool[]): Promise<ChatResponse>;
}
