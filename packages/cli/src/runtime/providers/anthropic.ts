// ADR: ADR-010-agent-runtime-architecture

/**
 * Anthropic Claude provider implementation.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  LLMProvider,
  Message,
  Tool,
  ChatResponse,
  ProviderConfig,
  StopReason,
  ToolCall,
} from "./types.js";
import { DEFAULT_MODELS, DEFAULT_MAX_TOKENS } from "./types.js";

/**
 * Map our message format to Anthropic's format.
 */
function toAnthropicMessages(
  messages: Message[]
): Anthropic.MessageParam[] {
  const result: Anthropic.MessageParam[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      // System messages are handled separately in Anthropic API
      continue;
    }

    if (msg.role === "tool") {
      // Tool results in Anthropic format
      result.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: msg.toolCallId ?? "",
            content: msg.content,
          },
        ],
      });
    } else if (msg.role === "user") {
      result.push({
        role: "user",
        content: msg.content,
      });
    } else if (msg.role === "assistant") {
      result.push({
        role: "assistant",
        content: msg.content,
      });
    }
  }

  return result;
}

/**
 * Extract system message from messages array.
 */
function extractSystemMessage(messages: Message[]): string | undefined {
  const systemMsg = messages.find((m) => m.role === "system");
  return systemMsg?.content;
}

/**
 * Map our tool format to Anthropic's format.
 */
function toAnthropicTools(tools: Tool[]): Anthropic.Tool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: "object" as const,
      properties: tool.parameters.properties,
      required: tool.parameters.required,
    },
  }));
}

/**
 * Map Anthropic stop reason to our format.
 */
function mapStopReason(
  stopReason: Anthropic.Message["stop_reason"]
): StopReason {
  switch (stopReason) {
    case "tool_use":
      return "tool_use";
    case "max_tokens":
      return "max_tokens";
    case "end_turn":
    default:
      return "end_turn";
  }
}

/**
 * Extract tool calls from Anthropic response.
 */
function extractToolCalls(content: Anthropic.ContentBlock[]): ToolCall[] {
  const toolCalls: ToolCall[] = [];

  for (const block of content) {
    if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id,
        name: block.name,
        arguments: block.input as Record<string, unknown>,
      });
    }
  }

  return toolCalls;
}

/**
 * Extract text content from Anthropic response.
 */
function extractTextContent(content: Anthropic.ContentBlock[]): string {
  const textBlocks = content.filter(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  return textBlocks.map((block) => block.text).join("");
}

/**
 * Anthropic Claude provider.
 */
export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic" as const;
  readonly model: string;

  private client: Anthropic;
  private maxTokens: number;
  private temperature?: number;

  constructor(config: ProviderConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.model = config.model ?? DEFAULT_MODELS.anthropic;
    this.maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.temperature = config.temperature;
  }

  async chat(messages: Message[], tools: Tool[]): Promise<ChatResponse> {
    const systemMessage = extractSystemMessage(messages);
    const anthropicMessages = toAnthropicMessages(messages);
    const anthropicTools = tools.length > 0 ? toAnthropicTools(tools) : undefined;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      system: systemMessage,
      messages: anthropicMessages,
      tools: anthropicTools,
    });

    return {
      content: extractTextContent(response.content),
      toolCalls: extractToolCalls(response.content),
      stopReason: mapStopReason(response.stop_reason),
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}
