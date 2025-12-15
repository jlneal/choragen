// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useCallback, useMemo } from "react";
import type { Settings, UiSettings } from "@choragen/core/config";
import { trpc } from "@/lib/trpc/client";

const DEFAULT_SETTINGS: Settings = {
  projectsFolder: undefined,
  lastProject: undefined,
  ui: {
    theme: "system",
    sidebarCollapsed: false,
  },
};

function normalizeSettings(settings?: Settings): Settings {
  return {
    projectsFolder: settings?.projectsFolder,
    lastProject: settings?.lastProject,
    ui: {
      theme: settings?.ui.theme ?? DEFAULT_SETTINGS.ui.theme,
      sidebarCollapsed: settings?.ui.sidebarCollapsed ?? DEFAULT_SETTINGS.ui.sidebarCollapsed,
    },
  };
}

function mergeSettings(base: Settings | undefined, update: { projectsFolder?: string; lastProject?: string; ui?: Partial<UiSettings> }): Settings {
  const current = normalizeSettings(base);
  return {
    ...current,
    ...(update.projectsFolder !== undefined && { projectsFolder: update.projectsFolder }),
    ...(update.lastProject !== undefined && { lastProject: update.lastProject }),
    ui: {
      ...current.ui,
      ...(update.ui ?? {}),
    },
  };
}

export interface UseSettingsResult {
  settings: Settings;
  isLoading: boolean;
  isError: boolean;
  error: unknown | null;
  setProjectsFolder: (projectsFolder: string) => Promise<void>;
  setLastProject: (lastProject: string) => Promise<void>;
  updateUI: (ui: Partial<UiSettings>) => Promise<void>;
  refresh: () => void;
}

export function useSettings(): UseSettingsResult {
  const utils = trpc.useUtils();
  const settingsQuery = trpc.settings.get.useQuery();

  const setProjectsFolderMutation = trpc.settings.setProjectsFolder.useMutation({
    onMutate: async (input) => {
      await utils.settings.get.cancel();
      const previous = utils.settings.get.getData();
      utils.settings.get.setData(undefined, mergeSettings(previous, { projectsFolder: input.projectsFolder }));
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        utils.settings.get.setData(undefined, context.previous);
      }
    },
    onSettled: () => {
      utils.settings.get.invalidate();
    },
  });

  const setLastProjectMutation = trpc.settings.setLastProject.useMutation({
    onMutate: async (input) => {
      await utils.settings.get.cancel();
      const previous = utils.settings.get.getData();
      utils.settings.get.setData(undefined, mergeSettings(previous, { lastProject: input.lastProject }));
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        utils.settings.get.setData(undefined, context.previous);
      }
    },
    onSettled: () => {
      utils.settings.get.invalidate();
    },
  });

  const updateUiMutation = trpc.settings.update.useMutation({
    onMutate: async (input) => {
      await utils.settings.get.cancel();
      const previous = utils.settings.get.getData();
      utils.settings.get.setData(undefined, mergeSettings(previous, { ui: input.ui ?? {} }));
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        utils.settings.get.setData(undefined, context.previous);
      }
    },
    onSettled: () => {
      utils.settings.get.invalidate();
    },
  });

  const settings = useMemo(
    () => normalizeSettings(settingsQuery.data ?? DEFAULT_SETTINGS),
    [settingsQuery.data]
  );

  const setProjectsFolder = useCallback(
    async (projectsFolder: string) => {
      await setProjectsFolderMutation.mutateAsync({ projectsFolder });
    },
    [setProjectsFolderMutation]
  );

  const setLastProject = useCallback(
    async (lastProject: string) => {
      await setLastProjectMutation.mutateAsync({ lastProject });
    },
    [setLastProjectMutation]
  );

  const updateUI = useCallback(
    async (ui: Partial<UiSettings>) => {
      await updateUiMutation.mutateAsync({ ui });
    },
    [updateUiMutation]
  );

  return {
    settings,
    isLoading: settingsQuery.isLoading,
    isError: settingsQuery.isError,
    error: settingsQuery.error ?? null,
    setProjectsFolder,
    setLastProject,
    updateUI,
    refresh: () => settingsQuery.refetch(),
  };
}
