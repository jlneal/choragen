// ADR: ADR-011-web-api-architecture
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { z } from "zod";

const CONFIG_RELATIVE_PATH = path.join(".choragen", "config.json");

const providerConfigSchema = z
  .object({
    providers: z
      .object({
        anthropic: z
          .object({
            apiKey: z.string().trim().min(1),
          })
          .partial()
          .optional(),
        openai: z
          .object({
            apiKey: z.string().trim().min(1),
          })
          .partial()
          .optional(),
        google: z
          .object({
            apiKey: z.string().trim().min(1),
          })
          .partial()
          .optional(),
        ollama: z
          .object({
            baseUrl: z.string().trim().min(1),
          })
          .partial()
          .optional(),
      })
      .partial()
      .optional(),
  })
  .partial();

type ProviderConfigFile = z.infer<typeof providerConfigSchema>;

export interface ProviderStatus {
  configured: boolean;
}

export interface ProviderConfig {
  providers: {
    anthropic: ProviderStatus;
    openai: ProviderStatus;
    google: ProviderStatus;
    ollama: ProviderStatus;
  };
}

export async function loadProviderConfig(
  projectRoot: string = process.cwd()
): Promise<ProviderConfig> {
  const configPath = path.join(projectRoot, CONFIG_RELATIVE_PATH);
  const config = await readProviderConfigFile(configPath);

  const anthropicKey =
    process.env.ANTHROPIC_API_KEY ?? config.providers?.anthropic?.apiKey;
  const openaiKey =
    process.env.OPENAI_API_KEY ?? config.providers?.openai?.apiKey;
  const googleKey =
    process.env.GOOGLE_API_KEY ?? config.providers?.google?.apiKey;
  const ollamaBaseUrl =
    process.env.OLLAMA_BASE_URL ?? config.providers?.ollama?.baseUrl;

  return {
    providers: {
      anthropic: { configured: isConfigured(anthropicKey) },
      openai: { configured: isConfigured(openaiKey) },
      google: { configured: isConfigured(googleKey) },
      ollama: { configured: isConfigured(ollamaBaseUrl) },
    },
  };
}

async function readProviderConfigFile(
  configPath: string
): Promise<ProviderConfigFile> {
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    return providerConfigSchema.parse(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    if (error instanceof z.ZodError) {
      throw error;
    }

    throw new Error(
      `Failed to load provider config from ${configPath}: ${(error as Error).message}`
    );
  }
}

function isConfigured(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}
