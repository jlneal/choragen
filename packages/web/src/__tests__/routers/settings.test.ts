/**
 * @design-doc docs/design/core/features/web-api.md
 * @test-type unit
 * @user-intent "Verify settings router manages provider flags, saves keys, and tests connections safely"
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { TRPCError } from "@trpc/server";
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers";

// HTTP status constants to avoid magic numbers
const HTTP_OK = 200;
const HTTP_UNAUTHORIZED = 401;

const createCaller = createCallerFactory(appRouter);

describe("settings router", () => {
  let projectRoot: string;
  let cleanupFn: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "choragen-settings-router-")
    );
    cleanupFn = async () => {
      await fs.rm(projectRoot, { recursive: true, force: true });
    };
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (cleanupFn) {
      await cleanupFn();
    }
  });

  it("returns provider flags based on config file", async () => {
    await writeConfig(projectRoot, {
      providers: {
        openai: { apiKey: "sk-openai" },
        ollama: { baseUrl: "http://localhost:11434" },
      },
    });

    const caller = createCaller({ projectRoot });
    const result = await caller.settings.getProviders();

    expect(result.anthropic).toBe(false);
    expect(result.openai).toBe(true);
    expect(result.google).toBe(false);
    expect(result.ollama).toBe(true);
  });

  it("returns false flags when config file is missing", async () => {
    const caller = createCaller({ projectRoot });
    const result = await caller.settings.getProviders();

    expect(result.anthropic).toBe(false);
    expect(result.openai).toBe(false);
    expect(result.google).toBe(false);
    expect(result.ollama).toBe(false);
  });

  it("persists updated API keys to config file", async () => {
    const caller = createCaller({ projectRoot });

    await caller.settings.updateApiKey({
      provider: "openai",
      apiKey: "sk-new-openai",
    });

    const configPath = path.join(projectRoot, ".choragen", "config.json");
    const raw = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(raw) as {
      providers?: Record<string, { apiKey?: string }>;
    };

    expect(config.providers?.openai?.apiKey).toBe("sk-new-openai");

    const providers = await caller.settings.getProviders();
    expect(providers.openai).toBe(true);
  });

  it("tests provider connections using supplied credentials", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: HTTP_OK }));

    const caller = createCaller({ projectRoot });
    const result = await caller.settings.testConnection({
      provider: "openai",
      apiKey: "sk-test",
    });

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/models",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer sk-test" }),
      })
    );
  });

  it("throws a TRPCError when provider test fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("unauthorized", { status: HTTP_UNAUTHORIZED, statusText: "Unauthorized" })
    );

    const caller = createCaller({ projectRoot });

    await expect(
      caller.settings.testConnection({
        provider: "anthropic",
        apiKey: "bad-key",
      })
    ).rejects.toBeInstanceOf(TRPCError);
  });
});

async function writeConfig(projectRoot: string, config: unknown): Promise<void> {
  const configDir = path.join(projectRoot, ".choragen");
  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(
    path.join(configDir, "config.json"),
    JSON.stringify(config, null, 2),
    "utf-8"
  );
}
