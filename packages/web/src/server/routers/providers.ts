// ADR: ADR-011-web-api-architecture

/**
 * Providers tRPC Router
 *
 * Exposes model lists from configured providers (Anthropic, OpenAI).
 * Uses @choragen/core provider registry with env-based API keys.
 */
import { router, publicProcedure } from "../trpc";
import { loadProviderConfig } from "@choragen/core/config";
import {
  ProviderRegistry,
  AnthropicProvider,
  OpenAIProvider,
  type ModelInfo,
} from "@choragen/core/providers";

type ProviderId = "anthropic" | "openai";

interface ProviderModels {
  configured: boolean;
  models: ModelInfo[];
}

export const providersRouter = router({
  listModels: publicProcedure.query(async ({ ctx }) => {
    const config = await loadProviderConfig(ctx.projectRoot);
    const registry = new ProviderRegistry({
      providers: [new AnthropicProvider(), new OpenAIProvider()],
    });

    const entries: Array<{ id: ProviderId; configured: boolean }> = [
      { id: "anthropic", configured: config.providers.anthropic.configured },
      { id: "openai", configured: config.providers.openai.configured },
    ];

    const providers: Record<ProviderId, ProviderModels> = {
      anthropic: { configured: entries[0].configured, models: [] },
      openai: { configured: entries[1].configured, models: [] },
    };

    for (const entry of entries) {
      if (!entry.configured) continue;
      providers[entry.id].models = await registry.listModels(entry.id);
    }

    const hasAnyConfigured = entries.some((entry) => entry.configured);
    const hasAnyModels = Object.values(providers).some(
      (provider) => provider.models.length > 0
    );

    return {
      providers,
      hasAnyConfigured,
      hasAnyModels,
      models: Object.values(providers)
        .map((provider) => provider.models)
        .flat(),
    };
  }),
});
