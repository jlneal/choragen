// ADR: ADR-011-workflow-orchestration

import type { ModelReference } from "../workflow/types.js";

export interface ModelCapabilities {
  chat: boolean;
  tools?: boolean;
  vision?: boolean;
  audio?: boolean;
  embeddings?: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: ModelReference["provider"];
  capabilities: ModelCapabilities;
}

export interface ModelProvider {
  /** Unique provider identifier (e.g., openai, anthropic) */
  id: string;
  /** Retrieve available models from the provider */
  listModels(): Promise<ModelInfo[]>;
}

export interface ProviderRegistryOptions {
  providers?: ModelProvider[];
}

/**
 * Registry for working with multiple providers.
 * Avoids failing when a single provider is misconfigured by isolating errors per provider.
 */
export class ProviderRegistry {
  private providers = new Map<string, ModelProvider>();

  constructor(options: ProviderRegistryOptions = {}) {
    options.providers?.forEach((provider) => this.register(provider));
  }

  register(provider: ModelProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(providerId: string): ModelProvider | undefined {
    return this.providers.get(providerId);
  }

  async listModels(providerId?: string): Promise<ModelInfo[]> {
    if (providerId) {
      const provider = this.providers.get(providerId);
      if (!provider) return [];
      return this.safeList(provider);
    }

    const results = await Promise.all(Array.from(this.providers.values()).map((provider) => this.safeList(provider)));
    return results.flat();
  }

  private async safeList(provider: ModelProvider): Promise<ModelInfo[]> {
    try {
      return await provider.listModels();
    } catch {
      return [];
    }
  }
}

export const MODEL_CACHE_TTL_MS = 5 * 60 * 1000;
