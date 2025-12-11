// ADR: ADR-011-web-api-architecture

/**
 * Settings tRPC Router
 *
 * Manages provider configuration for API keys and connection testing.
 * Keys are never returned to the client—only boolean configuration status.
 */
import * as fs from "fs/promises";
import * as path from "path";
import { z } from "zod";
import { loadProviderConfig } from "@choragen/core/config";
import { router, publicProcedure, TRPCError } from "../trpc";

const providerSchema = z.enum(["anthropic", "openai", "google", "ollama"]);

const updateApiKeyInput = z.object({
  provider: providerSchema,
  apiKey: z.string().trim().min(1, "API key is required"),
});

const testConnectionInput = z.object({
  provider: providerSchema,
  apiKey: z.string().trim().min(1, "API key is required"),
});

const providerConfigSchema = z
  .object({
    providers: z
      .object({
        anthropic: z.object({ apiKey: z.string().trim().min(1) }).partial().optional(),
        openai: z.object({ apiKey: z.string().trim().min(1) }).partial().optional(),
        google: z.object({ apiKey: z.string().trim().min(1) }).partial().optional(),
        ollama: z.object({ baseUrl: z.string().trim().min(1) }).partial().optional(),
      })
      .partial()
      .default({}),
  })
  .default({ providers: {} });

type ProviderConfigFile = z.infer<typeof providerConfigSchema>;

function getConfigPath(projectRoot: string): string {
  return path.join(projectRoot, ".choragen", "config.json");
}

async function readConfigFile(projectRoot: string): Promise<ProviderConfigFile> {
  const configPath = getConfigPath(projectRoot);
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    return providerConfigSchema.parse(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { providers: {} };
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to read provider config",
      cause: error,
    });
  }
}

async function writeConfigFile(projectRoot: string, config: ProviderConfigFile): Promise<void> {
  const configDir = path.join(projectRoot, ".choragen");
  const targetPath = getConfigPath(projectRoot);
  const tmpPath = `${targetPath}.tmp-${Date.now()}`;

  try {
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(tmpPath, JSON.stringify(config, null, 2), "utf-8");
    await fs.rename(tmpPath, targetPath);
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to write provider config",
      cause: error,
    });
  } finally {
    // Clean up tmp file if rename failed
    await fs.rm(tmpPath, { force: true }).catch(() => {});
  }
}

async function testProviderConnection(provider: z.infer<typeof providerSchema>, apiKey: string): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    let response: Response;
    switch (provider) {
      case "anthropic":
        response = await fetch("https://api.anthropic.com/v1/models", {
          method: "GET",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          signal: controller.signal,
        });
        break;
      case "openai":
        response = await fetch("https://api.openai.com/v1/models", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          signal: controller.signal,
        });
        break;
      case "google":
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
          {
            method: "GET",
            signal: controller.signal,
          }
        );
        break;
      case "ollama": {
        const baseUrl = apiKey;
        response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, {
          method: "GET",
          signal: controller.signal,
        });
        break;
      }
    }

    if (!response.ok) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Connection test failed: ${response.status} ${response.statusText}`,
      });
    }
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to test provider connection: ${message}`,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Settings router exposing provider configuration.
 */
export const settingsRouter = router({
  /**
   * Get configured providers (boolean flags only).
   */
  getProviders: publicProcedure.query(async ({ ctx }) => {
    const config = await loadProviderConfig(ctx.projectRoot);

    return {
      anthropic: config.providers.anthropic.configured,
      openai: config.providers.openai.configured,
      google: config.providers.google.configured,
      ollama: config.providers.ollama.configured,
    };
  }),

  /**
   * Update provider API key (or base URL for Ollama) in config.json.
   */
  updateApiKey: publicProcedure
    .input(updateApiKeyInput)
    .mutation(async ({ input, ctx }) => {
      const config = await readConfigFile(ctx.projectRoot);
      const providers = config.providers ?? {};

      const updatedProviders: ProviderConfigFile["providers"] = {
        ...providers,
        [input.provider]:
          input.provider === "ollama"
            ? { ...(providers.ollama ?? {}), baseUrl: input.apiKey }
            : { ...(providers[input.provider] ?? {}), apiKey: input.apiKey },
      };

      await writeConfigFile(ctx.projectRoot, {
        providers: updatedProviders,
      });

      return {
        success: true,
      };
    }),

  /**
   * Validate a provider key by performing a lightweight API call.
   */
  testConnection: publicProcedure
    .input(testConnectionInput)
    .mutation(async ({ input }) => {
      await testProviderConnection(input.provider, input.apiKey);
      return { success: true };
    }),
});
