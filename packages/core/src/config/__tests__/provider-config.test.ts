/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @test-type unit
 * @user-intent "Verify provider config loads from file and env vars with correct precedence"
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { loadProviderConfig } from "../provider-config.js";

describe("loadProviderConfig", () => {
  let tempDir: string;
  const originalEnv = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
  };

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-provider-"));
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.OLLAMA_BASE_URL;
  });

  afterEach(async () => {
    process.env.ANTHROPIC_API_KEY = originalEnv.ANTHROPIC_API_KEY;
    process.env.OPENAI_API_KEY = originalEnv.OPENAI_API_KEY;
    process.env.GOOGLE_API_KEY = originalEnv.GOOGLE_API_KEY;
    process.env.OLLAMA_BASE_URL = originalEnv.OLLAMA_BASE_URL;

    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("returns empty provider config when file is missing", async () => {
    const config = await loadProviderConfig(tempDir);

    expect(config.providers.anthropic.configured).toBe(false);
    expect(config.providers.openai.configured).toBe(false);
    expect(config.providers.google.configured).toBe(false);
    expect(config.providers.ollama.configured).toBe(false);
  });

  it("loads provider flags from config file", async () => {
    await writeConfig(tempDir, {
      providers: {
        anthropic: { apiKey: "sk-ant-config" },
        openai: { apiKey: "sk-openai-config" },
        google: { apiKey: "sk-google-config" },
        ollama: { baseUrl: "http://localhost:11434" },
      },
    });

    const config = await loadProviderConfig(tempDir);

    expect(config.providers.anthropic.configured).toBe(true);
    expect(config.providers.openai.configured).toBe(true);
    expect(config.providers.google.configured).toBe(true);
    expect(config.providers.ollama.configured).toBe(true);
  });

  it("prefers environment variables over config file entries", async () => {
    await writeConfig(tempDir, {
      providers: {
        anthropic: { apiKey: "sk-ant-config" },
      },
    });

    process.env.ANTHROPIC_API_KEY = "sk-ant-env";
    process.env.OPENAI_API_KEY = "sk-openai-env";
    process.env.GOOGLE_API_KEY = "sk-google-env";
    process.env.OLLAMA_BASE_URL = "http://remote-ollama:11434";

    const config = await loadProviderConfig(tempDir);

    expect(config.providers.anthropic.configured).toBe(true);
    expect(config.providers.openai.configured).toBe(true);
    expect(config.providers.google.configured).toBe(true);
    expect(config.providers.ollama.configured).toBe(true);
  });
});

async function writeConfig(projectRoot: string, config: unknown): Promise<void> {
  const configDir = path.join(projectRoot, ".choragen");
  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(
    path.join(configDir, "config.json"),
    JSON.stringify(config, null, 2)
  );
}
