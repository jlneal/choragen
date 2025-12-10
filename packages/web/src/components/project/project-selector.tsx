// ADR: ADR-011-web-api-architecture
"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Folder, FolderOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ProjectBrowser } from "@/components/project/project-browser";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RECENT_PROJECTS_LIMIT } from "@/lib/project-storage";
import { trpc } from "@/lib/trpc/client";
import { useProject } from "@/hooks";
import { cn } from "@/lib/utils";

interface ProjectSelectorProps {
  className?: string;
}

function getProjectName(projectPath: string): string {
  if (!projectPath) {
    return "Select project";
  }

  const normalized = projectPath.replace(/[\\/]+$/, "");
  const segments = normalized.split(/[/\\]/).filter(Boolean);

  if (segments.length === 0) {
    return projectPath;
  }

  return segments[segments.length - 1];
}

export function ProjectSelector({ className }: ProjectSelectorProps) {
  const { projectPath, recentProjects, selectProject } = useProject();
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);

  const displayedProjects = useMemo(
    () =>
      recentProjects
        .map((project) => project.trim())
        .filter((project) => project.length > 0)
        .slice(0, RECENT_PROJECTS_LIMIT),
    [recentProjects]
  );

  const switchMutation = trpc.project.switch.useMutation({
    onSuccess: (result) => {
      const errorMessage = "error" in result ? result.error : undefined;

      if (!result.success || !("projectRoot" in result)) {
        toast.error("Invalid project path", {
          description: errorMessage ?? "Project path failed validation.",
        });
        return;
      }

      const { projectRoot, name } = result;

      selectProject(projectRoot);
      toast.success("Project switched", {
        description: name,
      });
      setIsBrowserOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to switch project", {
        description: error.message,
      });
    },
  });

  const handleSwitch = (path: string) => {
    const trimmed = path.trim();
    if (!trimmed) {
      toast.error("Project path is required");
      return;
    }

    if (trimmed === projectPath) {
      setIsBrowserOpen(false);
      return;
    }

    switchMutation.mutate({ path: trimmed });
  };

  const currentName = getProjectName(projectPath);
  const isSwitching = switchMutation.isPending;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("h-9 gap-2 px-3", className)}
          >
            <FolderOpen className="h-4 w-4" />
            <span className="max-w-[140px] truncate text-sm font-medium">
              {currentName}
            </span>
            {isSwitching ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Recent Projects</DropdownMenuLabel>
          {displayedProjects.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No recent projects
            </div>
          ) : (
            displayedProjects.map((project) => {
              const name = getProjectName(project);
              const isActive = project === projectPath;

              return (
                <DropdownMenuItem
                  key={project}
                  className="flex items-center justify-between gap-2"
                  onSelect={() => handleSwitch(project)}
                  disabled={isSwitching}
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <Folder className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {project}
                      </div>
                    </div>
                  </div>
                  {isActive ? (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  ) : null}
                </DropdownMenuItem>
              );
            })
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2"
            onSelect={() => setIsBrowserOpen(true)}
            disabled={isSwitching}
          >
            <FolderOpen className="h-4 w-4" />
            Browse...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProjectBrowser
        open={isBrowserOpen}
        onOpenChange={setIsBrowserOpen}
        onSubmit={handleSwitch}
        isLoading={isSwitching}
        initialPath={projectPath}
      />
    </>
  );
}
