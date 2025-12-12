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
import { trpc } from "@/lib/trpc/client";

interface RoleEditorProps {
  mode: "create" | "edit";
  roleId?: string;
  role?: {
    id: string;
    name: string;
    description?: string;
    toolIds: string[];
  };
}

interface FormErrors {
  name?: string;
  tools?: string;
}

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
  const [errors, setErrors] = useState<FormErrors>({});

  const initializedRef = useRef(false);
  useEffect(() => {
    if (role && !initializedRef.current) {
      setName(role.name ?? "");
      setSelectedToolIds(role.toolIds ?? []);
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

    if (!trimmedName) {
      nextErrors.name = "Name is required";
    }

    if (selectedToolIds.length === 0) {
      nextErrors.tools = "Select at least one tool";
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
    if (mode === "create") {
      createMutation.mutate({
        name: trimmedName,
        toolIds: selectedToolIds,
      });
    } else if (roleId) {
      updateMutation.mutate({
        id: roleId,
        name: trimmedName,
        toolIds: selectedToolIds,
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
