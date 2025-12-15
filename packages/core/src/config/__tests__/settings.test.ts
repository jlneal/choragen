/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @test-type unit
 * @user-intent "Validate settings loader defaults, schema validation, and resilience to missing files"
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { loadSettings, type ThemePreference } from "../settings.js";

describe("loadSettings", () => {
  let tempDir: string;
  const defaultTheme: ThemePreference = "system";

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-settings-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("returns defaults when config file is missing", async () => {
    const settings = await loadSettings(tempDir);

    expect(settings.projectsFolder).toBeUndefined();
    expect(settings.lastProject).toBeUndefined();
    expect(settings.ui).toEqual({
      theme: defaultTheme,
      sidebarCollapsed: false,
    });
  });

  it("loads settings from config file", async () => {
    await writeConfig(tempDir, {
      settings: {
        projectsFolder: "/Users/test/Projects",
        lastProject: "/Users/test/Projects/choragen",
        ui: {
          theme: "dark",
          sidebarCollapsed: true,
        },
      },
    });

    const settings = await loadSettings(tempDir);

    expect(settings.projectsFolder).toBe("/Users/test/Projects");
    expect(settings.lastProject).toBe("/Users/test/Projects/choragen");
    expect(settings.ui).toEqual({
      theme: "dark",
      sidebarCollapsed: true,
    });
  });

  it("applies defaults when settings section is missing", async () => {
    await writeConfig(tempDir, {
      providers: {
        openai: { apiKey: "sk-placeholder" },
      },
    });

    const settings = await loadSettings(tempDir);

    expect(settings.projectsFolder).toBeUndefined();
    expect(settings.lastProject).toBeUndefined();
    expect(settings.ui).toEqual({
      theme: defaultTheme,
      sidebarCollapsed: false,
    });
  });

  it("returns defaults when config file is invalid JSON", async () => {
    const configDir = path.join(tempDir, ".choragen");
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(path.join(configDir, "config.json"), "{ invalid json", "utf-8");

    const settings = await loadSettings(tempDir);

    expect(settings.projectsFolder).toBeUndefined();
    expect(settings.lastProject).toBeUndefined();
    expect(settings.ui).toEqual({
      theme: defaultTheme,
      sidebarCollapsed: false,
    });
  });

  it("falls back to defaults when schema validation fails", async () => {
    await writeConfig(tempDir, {
      settings: {
        ui: {
          theme: "neon",
        },
      },
    });

    const settings = await loadSettings(tempDir);

    expect(settings.projectsFolder).toBeUndefined();
    expect(settings.lastProject).toBeUndefined();
    expect(settings.ui).toEqual({
      theme: defaultTheme,
      sidebarCollapsed: false,
    });
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
