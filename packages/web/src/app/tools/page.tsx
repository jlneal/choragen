// ADR: ADR-011-web-api-architecture
"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { ChevronDown, ChevronRight, RefreshCcw, Search } from "lucide-react";

import { ToolCard, ToolCardSkeleton } from "@/components/tools/tool-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/client";
import type { ToolCategory, ToolMetadata } from "@choragen/core";

interface RoleData {
  id: string;
  name: string;
  toolIds: string[];
}

const FALLBACK_CATEGORY: ToolCategory = {
  id: "uncategorized",
  name: "Uncategorized",
  description: "Tools without an assigned category",
  order: Number.MAX_SAFE_INTEGER,
};

interface ToolGroup {
  category: ToolCategory;
  tools: ToolMetadata[];
}

function formatCategoryName(id: string): string {
  if (!id) return FALLBACK_CATEGORY.name;
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function groupTools(tools: ToolMetadata[], categories?: ToolCategory[]): ToolGroup[] {
  const categoryMap = new Map<string, ToolCategory>();
  categories?.forEach((category) => categoryMap.set(category.id, category));

  const grouped = new Map<string, ToolMetadata[]>();
  tools.forEach((tool) => {
    const categoryId = tool.category ?? FALLBACK_CATEGORY.id;
    const list = grouped.get(categoryId) ?? [];
    list.push(tool);
    grouped.set(categoryId, list);
  });

  const knownCategories = (categories ?? [])
    .filter((category) => grouped.has(category.id))
    .sort((a, b) => a.order - b.order);

  const unknownCategories = Array.from(grouped.keys())
    .filter((id) => !categoryMap.has(id))
    .map((id) => ({
      ...FALLBACK_CATEGORY,
      id,
      name: formatCategoryName(id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const orderedCategories = [...knownCategories, ...unknownCategories];

  return orderedCategories.map((category) => ({
    category,
    tools: (grouped.get(category.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

function LoadingState() {
  const COUNT = 6;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: COUNT }).map((_, index) => (
        <ToolCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default function ToolsPage() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

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

  const {
    data: roles = [],
    isLoading: isLoadingRoles,
    isError: isRolesError,
    error: rolesError,
    refetch: refetchRoles,
  } = trpc.roles.list.useQuery();

  const syncMutation = trpc.tools.sync.useMutation({
    onSuccess: () => {
      utils.tools.list.invalidate();
      utils.tools.getCategories.invalidate();
    },
  });

  const normalizedSearch = search.trim().toLowerCase();

  const categoryNames = useMemo(() => {
    const names = new Map<string, string>();
    categories.forEach((category) => names.set(category.id, category.name));
    tools.forEach((tool) => {
      const categoryId = tool.category ?? FALLBACK_CATEGORY.id;
      if (!names.has(categoryId)) {
        names.set(categoryId, formatCategoryName(categoryId));
      }
    });
    return names;
  }, [categories, tools]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const descriptionText = tool.description ?? "";
      const matchesSearch =
        !normalizedSearch ||
        tool.name.toLowerCase().includes(normalizedSearch) ||
        tool.id.toLowerCase().includes(normalizedSearch) ||
        descriptionText.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        categoryFilter === "all" ||
        (tool.category ?? FALLBACK_CATEGORY.id) === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [tools, normalizedSearch, categoryFilter]);

  const groupedTools = useMemo(
    () => groupTools(filteredTools, categories),
    [filteredTools, categories]
  );

  useEffect(() => {
    if (groupedTools.length > 0 && openCategories.size === 0) {
      setOpenCategories(new Set(groupedTools.map((group) => group.category.id)));
    }
  }, [groupedTools, openCategories]);

  const rolesByToolId = useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>();
    (roles as RoleData[]).forEach((role) => {
      role.toolIds?.forEach((toolId) => {
        const list = map.get(toolId) ?? [];
        list.push({ id: role.id, name: role.name });
        map.set(toolId, list);
      });
    });
    return map;
  }, [roles]);

  const isLoading = isLoadingTools || isLoadingCategories || isLoadingRoles;
  const hasError = isToolsError || isCategoriesError || isRolesError;
  const errorMessage =
    toolsError?.message || categoriesError?.message || rolesError?.message || "Unknown error";

  const handleToggleCategory = (id: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSync = () => {
    syncMutation.mutate();
  };

  const hasNoTools = !isLoading && filteredTools.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Tools</h1>
          <p className="text-muted-foreground">
            Browse available tools, their metadata, and which roles can access them.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refetchTools();
              void refetchCategories();
              void refetchRoles();
            }}
            disabled={isLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleSync} size="sm" disabled={syncMutation.isPending}>
            {syncMutation.isPending ? (
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            Sync Tools
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by tool name or ID"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value)}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {Array.from(categoryNames.entries()).map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {hasError ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Unable to load tools</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void refetchTools();
                void refetchCategories();
                void refetchRoles();
              }}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <LoadingState />
      ) : hasNoTools ? (
        <Card>
          <CardHeader>
            <CardTitle>No tools found</CardTitle>
            <CardDescription>
              {tools.length === 0
                ? "No tools are available. Sync tools to generate metadata."
                : "No tools match your filters. Adjust search or category to see more results."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSync} disabled={syncMutation.isPending}>
              {syncMutation.isPending ? (
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Sync Tools
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedTools.map((group) => {
            const isOpen = openCategories.has(group.category.id);
            return (
              <Card key={group.category.id}>
                <CardHeader
                  className="flex cursor-pointer flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  onClick={() => handleToggleCategory(group.category.id)}
                >
                  <div className="flex items-start gap-3">
                    {isOpen ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{group.category.name}</CardTitle>
                      {group.category.description && (
                        <CardDescription>{group.category.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {group.tools.length} tool{group.tools.length === 1 ? "" : "s"}
                  </Badge>
                </CardHeader>
                {isOpen && (
                  <>
                    <Separator />
                    <CardContent className="pt-6">
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {group.tools.map((tool) => (
                          <ToolCard
                            key={tool.id}
                            id={tool.id}
                            name={tool.name}
                            description={tool.description}
                            category={group.category.name}
                            mutates={tool.mutates}
                            roles={rolesByToolId.get(tool.id) ?? []}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
