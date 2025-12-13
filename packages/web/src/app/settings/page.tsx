// ADR: ADR-011-web-api-architecture
"use client";

import { useState } from "react";
import { ShieldCheck, WifiOff, Zap, Brain, Home, FolderOpen, Folder, Check } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { ApiKeyForm } from "@/components/settings/api-key-form";
import { ProviderCard } from "@/components/settings/provider-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProject } from "@/hooks";

const PROVIDERS = [
  {
    id: "anthropic" as const,
    name: "Anthropic",
    description: "Claude models for high-quality reasoning",
    icon: ShieldCheck,
    fieldLabel: "API Key",
    placeholder: "sk-ant-...",
  },
  {
    id: "openai" as const,
    name: "OpenAI",
    description: "GPT models for versatile generation",
    icon: Zap,
    fieldLabel: "API Key",
    placeholder: "sk-...",
  },
  {
    id: "google" as const,
    name: "Google",
    description: "Gemini models for multimodal tasks",
    icon: Brain,
    fieldLabel: "API Key",
    placeholder: "AIza...",
  },
  {
    id: "ollama" as const,
    name: "Ollama",
    description: "Local models via Ollama runtime",
    icon: Home,
    fieldLabel: "Base URL",
    placeholder: "http://localhost:11434",
  },
];

export default function SettingsPage() {
  const { data, isLoading, isError, refetch } = trpc.settings.getProviders.useQuery();
  const { projectPath, selectProject } = useProject();
  const [projectsDir, setProjectsDir] = useState("");
  
  const { data: projectsData, refetch: refetchProjects, isFetching: isLoadingProjects } = trpc.project.listProjects.useQuery(
    { directory: projectsDir },
    { enabled: projectsDir.length > 0 }
  );

  const switchMutation = trpc.project.switch.useMutation({
    onSuccess: (result) => {
      if (!result.success || !("projectRoot" in result)) {
        const errorMsg = "error" in result ? result.error : "Unknown error";
        toast.error("Invalid project", { description: errorMsg });
        return;
      }
      selectProject(result.projectRoot);
      toast.success("Project switched", { description: result.name });
    },
    onError: (error) => {
      toast.error("Failed to switch project", { description: error.message });
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Configure projects directory and provider credentials.
        </p>
      </div>

      {/* Projects Directory Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            <CardTitle>Projects Directory</CardTitle>
          </div>
          <CardDescription>
            Set a directory containing your Choragen projects. Projects with a .choragen folder will be listed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={projectsDir}
              onChange={(e) => setProjectsDir(e.target.value)}
              placeholder="e.g., ~/Projects or /Users/you/dev"
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => refetchProjects()}
              disabled={!projectsDir || isLoadingProjects}
            >
              {isLoadingProjects ? "Scanning..." : "Scan"}
            </Button>
          </div>
          
          {projectsData?.projects && projectsData.projects.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Found {projectsData.projects.length} project(s) in {projectsData.directory}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {projectsData.projects.map((project) => {
                  const isActive = project.path === projectPath;
                  return (
                    <button
                      key={project.path}
                      onClick={() => switchMutation.mutate({ path: project.path })}
                      disabled={switchMutation.isPending}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                        isActive ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <Folder className="h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{project.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{project.path}</div>
                      </div>
                      {isActive && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : projectsDir && !isLoadingProjects ? (
            <p className="text-sm text-muted-foreground">
              No Choragen projects found in this directory.
            </p>
          ) : null}

          {projectPath && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Current project</p>
              <p className="font-mono text-sm">{projectPath}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider Credentials Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Provider Credentials</h2>
          <p className="text-sm text-muted-foreground">
            Configure API keys for LLM providers.
          </p>
        </div>

        {isError ? (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <WifiOff className="h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load provider status</p>
              <p className="text-destructive/80">
                Check your connection and try again.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {PROVIDERS.map((provider) => {
              const configured = data?.[provider.id] ?? false;

              return (
                <ProviderCard
                  key={provider.id}
                  name={provider.name}
                  description={provider.description}
                  configured={configured}
                  icon={provider.icon}
                >
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Skeleton className="h-10 w-full sm:w-32" />
                        <Skeleton className="h-10 w-full sm:w-40" />
                      </div>
                    </div>
                  ) : (
                    <ApiKeyForm
                      provider={provider.id}
                      configured={configured}
                      fieldLabel={provider.fieldLabel}
                      placeholder={provider.placeholder}
                      onStatusChange={refetch}
                    />
                  )}
                </ProviderCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
