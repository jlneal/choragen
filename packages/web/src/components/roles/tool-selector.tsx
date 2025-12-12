// ADR: ADR-011-web-api-architecture
"use client";

import { useMemo } from "react";
import { Info, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { ToolCategory, ToolMetadata } from "@choragen/core";

const FALLBACK_CATEGORY: ToolCategory = {
  id: "uncategorized",
  name: "Uncategorized",
  description: "Tools without a category",
  order: Number.MAX_SAFE_INTEGER,
};

interface ToolSelectorProps {
  tools: ToolMetadata[];
  categories?: ToolCategory[];
  selectedToolIds: string[];
  onChange: (nextToolIds: string[]) => void;
  disabled?: boolean;
}

interface ToolGroup {
  category: ToolCategory;
  tools: ToolMetadata[];
}

function groupTools(
  tools: ToolMetadata[],
  categories: ToolCategory[] | undefined
): ToolGroup[] {
  const categoryMap = new Map<string, ToolCategory>();
  categories?.forEach((category) => categoryMap.set(category.id, category));

  const grouped = new Map<string, ToolMetadata[]>();
  tools.forEach((tool) => {
    const categoryId = tool.category || FALLBACK_CATEGORY.id;
    const existing = grouped.get(categoryId) ?? [];
    existing.push(tool);
    grouped.set(categoryId, existing);
  });

  const sortedCategories = (categories ?? [])
    .filter((category) => grouped.has(category.id))
    .sort((a, b) => a.order - b.order);

  const unknownCategories = Array.from(grouped.keys()).filter(
    (categoryId) => !categoryMap.has(categoryId)
  );

  const fallbackCategory =
    grouped.has(FALLBACK_CATEGORY.id) &&
    !unknownCategories.includes(FALLBACK_CATEGORY.id)
      ? [FALLBACK_CATEGORY]
      : [];

  const unsortedCategories = [...unknownCategories, ...fallbackCategory.map((c) => c.id)]
    .filter((categoryId) => grouped.has(categoryId))
    .map((categoryId) =>
      categoryMap.get(categoryId) ?? {
        ...FALLBACK_CATEGORY,
        id: categoryId,
        name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
      }
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const orderedCategories = [...sortedCategories, ...unsortedCategories];

  return orderedCategories.map((category) => ({
    category,
    tools: (grouped.get(category.id) ?? []).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
  }));
}

function ToolRow({
  tool,
  checked,
  onToggle,
  disabled,
}: {
  tool: ToolMetadata;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition",
        "hover:bg-muted/50",
        disabled && "cursor-not-allowed opacity-70"
      )}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onToggle(Boolean(value))}
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-sm font-medium leading-tight">{tool.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{tool.id}</p>
          </div>
          <TooltipProvider>
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs text-sm">
                {tool.description || "No description available"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tool.mutates && <Badge variant="outline">Mutates</Badge>}
          <Badge variant="secondary" className="font-normal">
            {tool.category || FALLBACK_CATEGORY.name}
          </Badge>
        </div>
      </div>
    </label>
  );
}

export function ToolSelector({
  tools,
  categories,
  selectedToolIds,
  onChange,
  disabled,
}: ToolSelectorProps) {
  const groups = useMemo(
    () => groupTools(tools, categories),
    [tools, categories]
  );

  const toggleTool = (toolId: string, checked: boolean) => {
    const set = new Set(selectedToolIds);
    if (checked) {
      set.add(toolId);
    } else {
      set.delete(toolId);
    }
    onChange(Array.from(set));
  };

  if (tools.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        <ShieldAlert className="h-4 w-4" />
        No tools available. Run a tool sync to populate tool metadata.
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[500px] rounded-md border">
      <div className="space-y-6 p-4">
        {groups.map((group) => (
          <div key={group.category.id} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{group.category.name}</p>
                {group.category.description && (
                  <p className="text-xs text-muted-foreground">
                    {group.category.description}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                {group.tools.length} tools
              </Badge>
            </div>
            <div className="space-y-2">
              {group.tools.map((tool) => (
                <ToolRow
                  key={tool.id}
                  tool={tool}
                  checked={selectedToolIds.includes(tool.id)}
                  onToggle={(checked) => toggleTool(tool.id, checked)}
                  disabled={disabled}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
