// ADR: ADR-011-web-api-architecture
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import {
  addRecentProject,
  clearRecentProjects as clearStoredProjects,
  loadRecentProjects,
} from "@/lib/project-storage";
import { useSettings } from "./use-settings";

const DEFAULT_PROJECT_PATH = process.env.NEXT_PUBLIC_CHORAGEN_PROJECT_ROOT || "";

export interface ProjectContextValue {
  projectPath: string;
  recentProjects: string[];
  selectProject: (projectPath: string) => void;
  clearHistory: () => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projectPath, setProjectPath] = useState<string>(DEFAULT_PROJECT_PATH);
  const [recentProjects, setRecentProjects] = useState<string[]>([]);
  const { settings, isLoading: isSettingsLoading, setLastProject } = useSettings();
  const hasInitializedFromSettings = useRef(false);

  useEffect(() => {
    const storedProjects = loadRecentProjects();
    setRecentProjects(storedProjects);

    if (!DEFAULT_PROJECT_PATH && storedProjects.length > 0) {
      setProjectPath(storedProjects[0]);
    }
  }, []);

  useEffect(() => {
    if (isSettingsLoading || hasInitializedFromSettings.current) {
      return;
    }

    hasInitializedFromSettings.current = true;

    if (settings.lastProject && !DEFAULT_PROJECT_PATH) {
      setProjectPath(settings.lastProject);
    }
  }, [isSettingsLoading, settings.lastProject]);

  useEffect(() => {
    if (!projectPath) {
      return;
    }

    setRecentProjects((current) => {
      if (current[0] === projectPath) {
        return current;
      }

      return addRecentProject(projectPath, current);
    });
  }, [projectPath]);

  const selectProject = useCallback((nextProjectPath: string) => {
    setProjectPath(nextProjectPath);
    setRecentProjects((current) => addRecentProject(nextProjectPath, current));
    setLastProject(nextProjectPath).catch(() => {
      // Settings persistence is best-effort; localStorage already saved
    });
  }, [setLastProject]);

  const clearHistory = useCallback(() => {
    setRecentProjects([]);
    clearStoredProjects();
  }, []);

  const value = useMemo(
    () => ({
      projectPath,
      recentProjects,
      selectProject,
      clearHistory,
    }),
    [clearHistory, projectPath, recentProjects, selectProject]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectContextValue {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }

  return context;
}
