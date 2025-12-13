// ADR: ADR-010-agent-runtime-architecture

/**
 * Google Gemini provider implementation.
 */

import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type FunctionDeclaration,
  type FunctionDeclarationSchemaProperty,
  type Part,
} from "@google/generative-ai";
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
 * Map our message format to Gemini's format.
 * Gemini uses "user" and "model" roles, and handles system prompts separately.
 */
function toGeminiContents(messages: Message[]): Content[] {
  const contents: Content[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      // System messages are handled via systemInstruction
      continue;
    }

    if (msg.role === "tool") {
      // Tool results in Gemini format
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: msg.toolName ?? "unknown",
              response: { result: msg.content },
            },
          },
        ],
      });
    } else if (msg.role === "user") {
      contents.push({
        role: "user",
        parts: [{ text: msg.content }],
      });
    } else if (msg.role === "assistant") {
      contents.push({
        role: "model",
        parts: [{ text: msg.content }],
      });
    }
  }

  return contents;
}

/**
 * Extract system message from messages array.
 */
function extractSystemMessage(messages: Message[]): string | undefined {
  const systemMsg = messages.find((m) => m.role === "system");
  return systemMsg?.content;
}

/**
 * Map property type string to Gemini SchemaType.
 */
function mapPropertyType(type: string): SchemaType {
  switch (type) {
    case "string":
      return SchemaType.STRING;
    case "number":
      return SchemaType.NUMBER;
    case "integer":
      return SchemaType.INTEGER;
    case "boolean":
      return SchemaType.BOOLEAN;
    case "array":
      return SchemaType.ARRAY;
    case "object":
      return SchemaType.OBJECT;
    default:
      return SchemaType.STRING;
  }
}

/**
 * Map our tool format to Gemini's format.
 */
function toGeminiFunctionDeclarations(tools: Tool[]): FunctionDeclaration[] {
  return tools.map((tool) => {
    // Convert properties to Gemini format
    const properties: Record<string, FunctionDeclarationSchemaProperty> = {};
    for (const [key, prop] of Object.entries(tool.parameters.properties)) {
      properties[key] = {
        type: mapPropertyType(prop.type),
        description: prop.description,
      };
    }

    return {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties,
        required: tool.parameters.required,
      },
    };
  });
}

/**
 * Map Gemini finish reason to our format.
 */
function mapStopReason(finishReason: string | undefined): StopReason {
  switch (finishReason) {
    case "STOP":
      return "end_turn";
    case "MAX_TOKENS":
      return "max_tokens";
    default:
      // Gemini doesn't have a specific "tool_use" finish reason
      // We detect tool use by checking if there are function calls
      return "end_turn";
  }
}

/**
 * Extract tool calls from Gemini response parts.
 */
function extractToolCalls(parts: Part[]): ToolCall[] {
  const toolCalls: ToolCall[] = [];

  for (const part of parts) {
    if ("functionCall" in part && part.functionCall) {
      toolCalls.push({
        // Gemini doesn't provide IDs, so we generate one
        id: `gemini-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: part.functionCall.name,
        arguments: (part.functionCall.args ?? {}) as Record<string, unknown>,
      });
    }
  }

  return toolCalls;
}

/**
 * Extract text content from Gemini response parts.
 */
function extractTextContent(parts: Part[]): string {
  return parts
    .filter((part): part is Part & { text: string } => "text" in part)
    .map((part) => part.text)
    .join("");
}

/**
 * Google Gemini provider.
 */
export class GeminiProvider implements LLMProvider {
  readonly name = "gemini" as const;
  readonly model: string;

  private client: GoogleGenerativeAI;
  private maxTokens: number;
  private temperature?: number;

  constructor(config: ProviderConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model ?? DEFAULT_MODELS.gemini;
    this.maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.temperature = config.temperature;
  }

  async chat(messages: Message[], tools: Tool[]): Promise<ChatResponse> {
    const systemInstruction = extractSystemMessage(messages);
    const contents = toGeminiContents(messages);
    const functionDeclarations =
      tools.length > 0 ? toGeminiFunctionDeclarations(tools) : undefined;

    const generativeModel = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction,
      generationConfig: {
        maxOutputTokens: this.maxTokens,
        temperature: this.temperature,
      },
      tools: functionDeclarations
        ? [{ functionDeclarations }]
        : undefined,
    });

    const result = await generativeModel.generateContent({
      contents,
    });

    const response = result.response;
    const candidate = response.candidates?.[0];

    if (!candidate) {
      throw new Error("No response from Gemini");
    }

    const parts = candidate.content?.parts ?? [];
    const toolCalls = extractToolCalls(parts);

    // If there are tool calls, the stop reason should be tool_use
    const stopReason =
      toolCalls.length > 0
        ? "tool_use"
        : mapStopReason(candidate.finishReason);

    return {
      content: extractTextContent(parts),
      toolCalls,
      stopReason,
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }
}
