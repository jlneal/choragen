// ADR: ADR-011-web-api-architecture

const RECENT_PROJECTS_KEY = "choragen:recent-projects";
export const RECENT_PROJECTS_LIMIT = 5;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readRecentProjects(): string[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(RECENT_PROJECTS_KEY);
    const parsed = stored ? JSON.parse(stored) : null;

    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }

    return [];
  } catch {
    return [];
  }
}

export function loadRecentProjects(): string[] {
  return readRecentProjects();
}

export function saveRecentProjects(projects: string[]): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(projects));
  } catch {
    // Ignore storage errors to keep UX smooth
  }
}

export function addRecentProject(projectPath: string, current: string[]): string[] {
  const normalizedPath = projectPath.trim();

  if (!normalizedPath) {
    return current;
  }

  const deduped = [normalizedPath, ...current.filter((project) => project !== normalizedPath)];
  const limited = deduped.slice(0, RECENT_PROJECTS_LIMIT);

  saveRecentProjects(limited);

  return limited;
}

export function clearRecentProjects(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(RECENT_PROJECTS_KEY);
  } catch {
    // Ignore storage errors to keep UX smooth
  }
}
