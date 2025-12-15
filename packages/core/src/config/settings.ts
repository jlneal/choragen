// ADR: ADR-011-web-api-architecture
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { z } from "zod";

const CONFIG_RELATIVE_PATH = path.join(".choragen", "config.json");

const uiSettingsSchema = z
  .object({
    theme: z.enum(["light", "dark", "system"]).optional(),
    sidebarCollapsed: z.boolean().optional(),
  })
  .partial();

const settingsSchema = z
  .object({
    projectsFolder: z.string().trim().min(1).optional(),
    lastProject: z.string().trim().min(1).optional(),
    ui: uiSettingsSchema.optional(),
  })
  .partial();

const settingsConfigSchema = z
  .object({
    settings: settingsSchema.optional(),
  })
  .partial();

type SettingsConfigFile = z.infer<typeof settingsConfigSchema>;
type SettingsFileSettings = z.infer<typeof settingsSchema>;

export type ThemePreference = NonNullable<
  z.infer<typeof uiSettingsSchema>["theme"]
>;

export interface UiSettings {
  theme: ThemePreference;
  sidebarCollapsed: boolean;
}

export interface Settings {
  projectsFolder?: string;
  lastProject?: string;
  ui: UiSettings;
}

const DEFAULT_UI_SETTINGS: UiSettings = {
  theme: "system",
  sidebarCollapsed: false,
};

/**
 * Load persisted settings from `.choragen/config.json`.
 *
 * Returns defaults when the file or settings section is missing or invalid.
 */
export async function loadSettings(
  projectRoot: string = process.cwd()
): Promise<Settings> {
  const configPath = path.join(projectRoot, CONFIG_RELATIVE_PATH);
  const config = await readSettingsConfigFile(configPath);

  return applyDefaults(config.settings);
}

async function readSettingsConfigFile(
  configPath: string
): Promise<SettingsConfigFile> {
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    const result = settingsConfigSchema.safeParse(parsed);

    if (!result.success) {
      return {};
    }

    return result.data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    if (error instanceof SyntaxError) {
      return {};
    }

    throw new Error(
      `Failed to load settings from ${configPath}: ${(error as Error).message}`
    );
  }
}

function applyDefaults(settings?: SettingsFileSettings): Settings {
  return {
    projectsFolder: settings?.projectsFolder,
    lastProject: settings?.lastProject,
    ui: {
      theme: settings?.ui?.theme ?? DEFAULT_UI_SETTINGS.theme,
      sidebarCollapsed:
        settings?.ui?.sidebarCollapsed ?? DEFAULT_UI_SETTINGS.sidebarCollapsed,
    },
  };
}
