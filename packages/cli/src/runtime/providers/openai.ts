// ADR: ADR-010-agent-runtime-architecture

/**
 * OpenAI GPT provider implementation.
 */

import OpenAI from "openai";
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
 * Map our message format to OpenAI's format.
 */
function toOpenAIMessages(
  messages: Message[]
): OpenAI.ChatCompletionMessageParam[] {
  return messages.map((msg): OpenAI.ChatCompletionMessageParam => {
    if (msg.role === "system") {
      return {
        role: "system",
        content: msg.content,
      };
    }

    if (msg.role === "tool") {
      return {
        role: "tool",
        tool_call_id: msg.toolCallId ?? "",
        content: msg.content,
      };
    }

    if (msg.role === "assistant") {
      return {
        role: "assistant",
        content: msg.content,
      };
    }

    // Default: user
    return {
      role: "user",
      content: msg.content,
    };
  });
}

/**
 * Map our tool format to OpenAI's format.
 */
function toOpenAITools(tools: Tool[]): OpenAI.ChatCompletionTool[] {
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
 * Map OpenAI finish reason to our format.
 */
function mapStopReason(
  finishReason: OpenAI.ChatCompletion.Choice["finish_reason"]
): StopReason {
  switch (finishReason) {
    case "tool_calls":
      return "tool_use";
    case "length":
      return "max_tokens";
    case "stop":
    default:
      return "end_turn";
  }
}

/**
 * Extract tool calls from OpenAI response.
 */
function extractToolCalls(
  toolCalls: OpenAI.ChatCompletionMessageToolCall[] | undefined
): ToolCall[] {
  if (!toolCalls) {
    return [];
  }

  return toolCalls.map((tc) => ({
    id: tc.id,
    name: tc.function.name,
    arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
  }));
}

/**
 * OpenAI GPT provider.
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = "openai" as const;
  readonly model: string;

  private client: OpenAI;
  private maxTokens: number;
  private temperature?: number;

  constructor(config: ProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.model = config.model ?? DEFAULT_MODELS.openai;
    this.maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.temperature = config.temperature;
  }

  async chat(messages: Message[], tools: Tool[]): Promise<ChatResponse> {
    const openaiMessages = toOpenAIMessages(messages);
    const openaiTools = tools.length > 0 ? toOpenAITools(tools) : undefined;

    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      messages: openaiMessages,
      tools: openaiTools,
    });

    const choice = response.choices[0];
    if (!choice) {
      throw new Error("No response from OpenAI");
    }

    return {
      content: choice.message.content ?? "",
      toolCalls: extractToolCalls(choice.message.tool_calls),
      stopReason: mapStopReason(choice.finish_reason),
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      },
    };
  }
}
