// ADR: ADR-011-workflow-orchestration

import { MODEL_CACHE_TTL_MS, type ModelInfo, type ModelProvider } from "./types.js";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/models";
const ANTHROPIC_API_VERSION = "2023-06-01";

type AnthropicModel = {
  id: string;
  display_name?: string;
};

type AnthropicModelListResponse = {
  data?: AnthropicModel[];
};

export class AnthropicProvider implements ModelProvider {
  id = "anthropic";

  private cache: { models: ModelInfo[]; expiresAt: number } | null = null;

  async listModels(): Promise<ModelInfo[]> {
    const cached = this.readCache();
    if (cached) return cached;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return [];

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_API_VERSION,
        },
      });

      if (!response.ok) {
        return [];
      }

      const body = (await response.json()) as AnthropicModelListResponse;
      const models = (body.data ?? []).map((model) => this.mapModel(model));
      this.writeCache(models);
      return models;
    } catch {
      return [];
    }
  }

  private readCache(): ModelInfo[] | null {
    if (this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.models;
    }
    return null;
  }

  private writeCache(models: ModelInfo[]): void {
    this.cache = {
      models,
      expiresAt: Date.now() + MODEL_CACHE_TTL_MS,
    };
  }

  private mapModel(model: AnthropicModel): ModelInfo {
    const name = typeof model.display_name === "string" && model.display_name.trim() ? model.display_name : model.id;

    return {
      id: model.id,
      name,
      provider: this.id,
      capabilities: { chat: true },
    };
  }
}
