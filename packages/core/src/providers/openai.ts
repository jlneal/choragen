// ADR: ADR-011-workflow-orchestration

import { MODEL_CACHE_TTL_MS, type ModelInfo, type ModelProvider } from "./types.js";

const OPENAI_API_URL = "https://api.openai.com/v1/models";

type OpenAIModel = {
  id: string;
};

type OpenAIModelListResponse = {
  data?: OpenAIModel[];
};

export class OpenAIProvider implements ModelProvider {
  id = "openai";

  private cache: { models: ModelInfo[]; expiresAt: number } | null = null;

  async listModels(): Promise<ModelInfo[]> {
    const cached = this.readCache();
    if (cached) return cached;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return [];

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const body = (await response.json()) as OpenAIModelListResponse;
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

  private mapModel(model: OpenAIModel): ModelInfo {
    const isEmbedding = model.id.toLowerCase().includes("embedding");

    return {
      id: model.id,
      name: model.id,
      provider: this.id,
      capabilities: {
        chat: !isEmbedding,
        embeddings: isEmbedding,
      },
    };
  }
}
