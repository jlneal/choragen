// ADR: ADR-011-web-api-architecture
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  addRecentProject,
  clearRecentProjects as clearStoredProjects,
  loadRecentProjects,
} from "@/lib/project-storage";

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

  useEffect(() => {
    const storedProjects = loadRecentProjects();
    setRecentProjects(storedProjects);

    if (!DEFAULT_PROJECT_PATH && storedProjects.length > 0) {
      setProjectPath(storedProjects[0]);
    }
  }, []);

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
    // TODO: Notify backend via tRPC mutation (planned in TASK-057-002)
  }, []);

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
