// ADR: ADR-011-web-api-architecture
"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, RefreshCcw, Save, Trash2 } from "lucide-react";

import { ToolSelector } from "@/components/roles/tool-selector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc/client";

type RoleModelConfig = {
  provider: string;
  model: string;
  temperature: number;
  maxTokens?: number;
};

interface RoleEditorProps {
  mode: "create" | "edit";
  roleId?: string;
  role?: {
    id: string;
    name: string;
    description?: string;
    toolIds: string[];
    model?: RoleModelConfig;
    systemPrompt?: string;
  };
}

interface FormErrors {
  name?: string;
  tools?: string;
  provider?: string;
  model?: string;
  temperature?: string;
}

type ProviderOption = "anthropic" | "openai" | "gemini" | "ollama";

const PROVIDER_OPTIONS: ProviderOption[] = ["anthropic", "openai", "gemini", "ollama"];

const MODEL_SUGGESTIONS: Record<(typeof PROVIDER_OPTIONS)[number], string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  gemini: "gemini-2.0-flash",
  ollama: "llama3.2",
};

function RoleFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RoleEditor({ mode, roleId, role }: RoleEditorProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [name, setName] = useState(role?.name ?? "");
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(role?.toolIds ?? []);
  const [provider, setProvider] = useState<ProviderOption | "">(
    (role?.model?.provider as ProviderOption | undefined) ?? ""
  );
  const [modelName, setModelName] = useState<string>(role?.model?.model ?? "");
  const [temperature, setTemperature] = useState<number>(
    role?.model?.temperature ?? 0.3
  );
  const [maxTokens, setMaxTokens] = useState<string>(
    role?.model?.maxTokens?.toString() ?? ""
  );
  const [systemPrompt, setSystemPrompt] = useState<string>(role?.systemPrompt ?? "");
  const [showSystemPrompt, setShowSystemPrompt] = useState<boolean>(Boolean(role?.systemPrompt));
  const [errors, setErrors] = useState<FormErrors>({});

  const initializedRef = useRef(false);
  useEffect(() => {
    if (role && !initializedRef.current) {
      setName(role.name ?? "");
      setSelectedToolIds(role.toolIds ?? []);
      setProvider((role.model?.provider as ProviderOption | undefined) ?? "");
      setModelName(role.model?.model ?? "");
      setTemperature(role.model?.temperature ?? 0.3);
      setMaxTokens(role.model?.maxTokens?.toString() ?? "");
      setSystemPrompt(role.systemPrompt ?? "");
      setShowSystemPrompt(Boolean(role.systemPrompt));
      initializedRef.current = true;
    }
  }, [role]);

  const {
    data: tools = [],
    isLoading: isLoadingTools,
    isError: isToolsError,
    error: toolsError,
    refetch: refetchTools,
  } = trpc.tools.list.useQuery();

  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
    error: categoriesError,
    refetch: refetchCategories,
  } = trpc.tools.getCategories.useQuery();

  const createMutation = trpc.roles.create.useMutation({
    onSuccess: () => {
      utils.roles.list.invalidate();
      router.push("/roles");
    },
  });

  const updateMutation = trpc.roles.update.useMutation({
    onSuccess: (_, variables) => {
      utils.roles.list.invalidate();
      if (variables.id) {
        utils.roles.get.invalidate(variables.id);
      }
      router.push("/roles");
    },
  });

  const deleteMutation = trpc.roles.delete.useMutation({
    onSuccess: (_, id) => {
      utils.roles.list.invalidate();
      utils.roles.get.invalidate(id);
      router.push("/roles");
    },
  });

  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    const trimmedName = name.trim();
    const trimmedModel = modelName.trim();
    const trimmedProvider = provider.trim();
    const hasInputModelFields =
      trimmedProvider.length > 0 ||
      trimmedModel.length > 0 ||
      maxTokens.trim().length > 0;

    if (!trimmedName) {
      nextErrors.name = "Name is required";
    }

    if (selectedToolIds.length === 0) {
      nextErrors.tools = "Select at least one tool";
    }

    if (hasInputModelFields) {
      if (trimmedProvider && !PROVIDER_OPTIONS.includes(trimmedProvider as typeof PROVIDER_OPTIONS[number])) {
        nextErrors.provider = "Provider must be anthropic, openai, gemini, or ollama";
      }
      if (!trimmedProvider) {
        nextErrors.provider = "Provider is required for model configuration";
      }
      if (!trimmedModel) {
        nextErrors.model = "Model name is required";
      }
      if (Number.isNaN(temperature) || temperature < 0 || temperature > 1) {
        nextErrors.temperature = "Temperature must be between 0.0 and 1.0";
      }
      if (maxTokens.trim().length > 0) {
        const parsedMax = Number(maxTokens);
        if (!Number.isInteger(parsedMax) || parsedMax <= 0) {
          nextErrors.model = "Max tokens must be a positive integer";
        }
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedProvider = provider.trim();
    const trimmedModel = modelName.trim();
    const hasInputModelFields =
      trimmedProvider.length > 0 ||
      trimmedModel.length > 0 ||
      maxTokens.trim().length > 0;
    const parsedMaxTokens =
      maxTokens.trim().length > 0 ? Number(maxTokens) : undefined;
    const modelConfig = hasInputModelFields
      ? {
          provider: trimmedProvider as ProviderOption,
          model: trimmedModel,
          temperature,
          maxTokens: parsedMaxTokens,
        }
      : role?.model
        ? null
        : undefined;
    const normalizedSystemPrompt =
      systemPrompt.trim().length > 0
        ? systemPrompt.trim()
        : role?.systemPrompt
          ? null
          : undefined;

    if (mode === "create") {
      createMutation.mutate({
        name: trimmedName,
        toolIds: selectedToolIds,
        model: modelConfig ?? undefined,
        systemPrompt: normalizedSystemPrompt ?? undefined,
      });
    } else if (roleId) {
      updateMutation.mutate({
        id: roleId,
        name: trimmedName,
        toolIds: selectedToolIds,
        model: modelConfig,
        systemPrompt: normalizedSystemPrompt,
      });
    }
  };

  const handleDelete = () => {
    if (!roleId) return;
    deleteMutation.mutate(roleId);
  };

  const isLoading = isLoadingTools || isLoadingCategories || (mode === "edit" && !role);

  const hasToolLoadError = isToolsError || isCategoriesError;
  const toolFetchError = toolsError ?? categoriesError;

  const title = mode === "create" ? "Create Role" : `Edit Role`;
  const description =
    mode === "create"
      ? "Define which tools a new role can access."
      : "Update the tools and name for this role.";

  if (isLoading) {
    return <RoleFormSkeleton />;
  }

  if (hasToolLoadError) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Unable to load tools
          </CardTitle>
          <CardDescription>
            {toolFetchError instanceof Error
              ? toolFetchError.message
              : "Something went wrong while fetching tools or categories."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refetchTools();
              void refetchCategories();
            }}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/roles")}>
            Back to roles
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
        {mode === "edit" && role?.id && (
          <p className="text-sm text-muted-foreground">Role ID: {role.id}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role details</CardTitle>
          <CardDescription>Update the name and tool access for this role.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="role-name">Name</Label>
              <Input
                id="role-name"
                placeholder="Implementer"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                disabled={isMutating}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-tight">Model configuration</p>
                <p className="text-sm text-muted-foreground">
                  Configure the default model for this role. Leave blank to use environment defaults.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select
                    value={provider}
                    onValueChange={(value) => {
                      setProvider(value as ProviderOption);
                      if (errors.provider) {
                        setErrors((prev) => ({ ...prev, provider: undefined }));
                      }
                      if (!modelName && value) {
                        setModelName(MODEL_SUGGESTIONS[value as keyof typeof MODEL_SUGGESTIONS]);
                      }
                    }}
                    disabled={isMutating}
                  >
                    <SelectTrigger id="provider">
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDER_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.provider && (
                    <p className="text-sm text-destructive">{errors.provider}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder={
                      provider && MODEL_SUGGESTIONS[provider as keyof typeof MODEL_SUGGESTIONS]
                        ? MODEL_SUGGESTIONS[provider as keyof typeof MODEL_SUGGESTIONS]
                        : "Model name (e.g., claude-sonnet-4-20250514)"
                    }
                    value={modelName}
                    onChange={(event) => {
                      setModelName(event.target.value);
                      if (errors.model) {
                        setErrors((prev) => ({ ...prev, model: undefined }));
                      }
                    }}
                    disabled={isMutating}
                  />
                  {errors.model && <p className="text-sm text-destructive">{errors.model}</p>}
                  {provider && MODEL_SUGGESTIONS[provider as keyof typeof MODEL_SUGGESTIONS] && (
                    <p className="text-xs text-muted-foreground">
                      Suggested: {MODEL_SUGGESTIONS[provider as keyof typeof MODEL_SUGGESTIONS]}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="temperature">
                    Temperature <span className="text-muted-foreground">({temperature.toFixed(2)})</span>
                  </Label>
                  <input
                    id="temperature"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={temperature}
                    onChange={(event) => {
                      setTemperature(Number(event.target.value));
                      if (errors.temperature) {
                        setErrors((prev) => ({ ...prev, temperature: undefined }));
                      }
                    }}
                    disabled={isMutating}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.0</span>
                    <span>1.0</span>
                  </div>
                  {errors.temperature && (
                    <p className="text-sm text-destructive">{errors.temperature}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max tokens (optional)</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min={1}
                    placeholder="4096"
                    value={maxTokens}
                    onChange={(event) => {
                      setMaxTokens(event.target.value);
                      if (errors.model) {
                        setErrors((prev) => ({ ...prev, model: undefined }));
                      }
                    }}
                    disabled={isMutating}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="systemPrompt">System prompt</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSystemPrompt((prev) => !prev)}
                  >
                    {showSystemPrompt ? "Hide" : "Show"}
                  </Button>
                </div>
                {showSystemPrompt && (
                  <Textarea
                    id="systemPrompt"
                    placeholder="Customize the behavior for this role. Supports {{chainId}}, {{taskId}}, and {{toolSummaries}} placeholders."
                    value={systemPrompt}
                    onChange={(event) => setSystemPrompt(event.target.value)}
                    className="min-h-[140px]"
                    disabled={isMutating}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  {"Leave blank to use the default agent prompt. Use {{chainId}}, {{taskId}}, and {{toolSummaries}} placeholders to inject context."}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium leading-tight">Tools</p>
                  <p className="text-sm text-muted-foreground">
                    Select at least one tool to assign to this role.
                  </p>
                </div>
                {errors.tools && (
                  <p className="text-sm text-destructive sm:text-right">{errors.tools}</p>
                )}
              </div>
              <ToolSelector
                tools={tools}
                categories={categories}
                selectedToolIds={selectedToolIds}
                onChange={(next) => {
                  setSelectedToolIds(next);
                  if (errors.tools && next.length > 0) {
                    setErrors((prev) => ({ ...prev, tools: undefined }));
                  }
                }}
                disabled={isMutating}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {mode === "edit" && roleId ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isMutating}
                      className="sm:w-auto"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete role
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this role?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. Any workflows using this role may need
                        to be updated.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isMutating}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <div />
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/roles")}
                  disabled={isMutating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isMutating}>
                  {isMutating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {mode === "create" ? "Create Role" : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
