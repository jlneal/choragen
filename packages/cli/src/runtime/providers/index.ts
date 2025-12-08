// ADR: ADR-010-agent-runtime-architecture

/**
 * LLM Provider factory and exports.
 */

export type {
  LLMProvider,
  Message,
  MessageRole,
  Tool,
  ToolParameterSchema,
  ToolCall,
  ChatResponse,
  StopReason,
  TokenUsage,
  StreamChunk,
  ProviderConfig,
  ProviderName,
} from "./types.js";

export { DEFAULT_MODELS, DEFAULT_MAX_TOKENS } from "./types.js";

export { AnthropicProvider } from "./anthropic.js";
export { OpenAIProvider } from "./openai.js";
export { GeminiProvider } from "./gemini.js";

import type { LLMProvider, ProviderConfig, ProviderName } from "./types.js";
import { AnthropicProvider } from "./anthropic.js";
import { OpenAIProvider } from "./openai.js";
import { GeminiProvider } from "./gemini.js";

/**
 * Environment variable names for API keys.
 */
const API_KEY_ENV_VARS: Record<ProviderName, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
};

/**
 * Environment variable for provider selection.
 */
const PROVIDER_ENV_VAR = "CHORAGEN_PROVIDER";

/**
 * Get the API key for a provider from environment variables.
 * @param provider - Provider name
 * @returns API key or undefined if not set
 */
export function getApiKeyFromEnv(provider: ProviderName): string | undefined {
  return process.env[API_KEY_ENV_VARS[provider]];
}

/**
 * Get the selected provider from environment variables.
 * @returns Provider name or undefined if not set
 */
export function getProviderFromEnv(): ProviderName | undefined {
  const provider = process.env[PROVIDER_ENV_VAR];
  if (provider && isValidProviderName(provider)) {
    return provider;
  }
  return undefined;
}

/**
 * Check if a string is a valid provider name.
 */
function isValidProviderName(name: string): name is ProviderName {
  return name === "anthropic" || name === "openai" || name === "gemini";
}

/**
 * Error thrown when provider creation fails.
 */
export class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderError";
  }
}

/**
 * Create an LLM provider instance.
 *
 * @param name - Provider name ("anthropic", "openai", or "gemini")
 * @param config - Provider configuration (apiKey is required)
 * @returns LLM provider instance
 * @throws ProviderError if provider name is invalid or API key is missing
 *
 * @example
 * ```typescript
 * // Create with explicit config
 * const provider = createProvider("anthropic", {
 *   apiKey: process.env.ANTHROPIC_API_KEY!,
 *   model: "claude-sonnet-4-20250514",
 * });
 *
 * // Create from environment variables
 * const provider = createProviderFromEnv();
 * ```
 */
export function createProvider(
  name: ProviderName,
  config: ProviderConfig
): LLMProvider {
  if (!config.apiKey) {
    throw new ProviderError(
      `API key is required for ${name} provider. ` +
        `Set ${API_KEY_ENV_VARS[name]} environment variable or provide apiKey in config.`
    );
  }

  switch (name) {
    case "anthropic":
      return new AnthropicProvider(config);
    case "openai":
      return new OpenAIProvider(config);
    case "gemini":
      return new GeminiProvider(config);
    default: {
      const exhaustiveCheck: never = name;
      throw new ProviderError(`Unknown provider: ${exhaustiveCheck}`);
    }
  }
}

/**
 * Create an LLM provider from environment variables.
 *
 * Uses CHORAGEN_PROVIDER to select the provider (defaults to "anthropic").
 * Uses the appropriate API key environment variable for the selected provider.
 *
 * @param overrides - Optional config overrides (model, maxTokens, etc.)
 * @returns LLM provider instance
 * @throws ProviderError if API key is not set
 *
 * @example
 * ```typescript
 * // Uses CHORAGEN_PROVIDER and ANTHROPIC_API_KEY/OPENAI_API_KEY/GEMINI_API_KEY
 * const provider = createProviderFromEnv();
 *
 * // Override model
 * const provider = createProviderFromEnv({ model: "gpt-4o-mini" });
 * ```
 */
export function createProviderFromEnv(
  overrides?: Omit<ProviderConfig, "apiKey">
): LLMProvider {
  const providerName = getProviderFromEnv() ?? "anthropic";
  const apiKey = getApiKeyFromEnv(providerName);

  if (!apiKey) {
    throw new ProviderError(
      `API key not found. Set ${API_KEY_ENV_VARS[providerName]} environment variable.`
    );
  }

  return createProvider(providerName, {
    apiKey,
    ...overrides,
  });
}
