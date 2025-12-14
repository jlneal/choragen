// ADR: ADR-011-web-api-architecture
"use client";

import { useEffect, useMemo } from "react";

import type { ModelReference } from "@choragen/core";
import type { ModelInfo } from "@choragen/core/providers";
import { TriangleAlert } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type ProviderId = "anthropic" | "openai";

type ProviderModels = Record<ProviderId, { configured: boolean; models: ModelInfo[] }>;

const EMPTY_PROVIDERS: ProviderModels = {
  anthropic: { configured: false, models: [] },
  openai: { configured: false, models: [] },
};

const NO_DEFAULT_VALUE = "__none__";

interface StageModelConfigProps {
  value?: ModelReference;
  onChange: (model?: ModelReference) => void;
  disabled?: boolean;
}

function asValue(model?: ModelReference): string {
  if (!model) return NO_DEFAULT_VALUE;
  return `${model.provider}:${model.model}`;
}

function isAvailable(model: ModelReference, providers: ProviderModels): boolean {
  const provider = providers[model.provider as ProviderId];
  if (!provider || !provider.configured) return false;
  return provider.models.some((item) => item.id === model.model);
}

function formatLabel(model: ModelInfo): string {
  return model.name || model.id;
}

export function StageModelConfig({ value, onChange, disabled }: StageModelConfigProps) {
  const { data, isLoading, isError, refetch } = trpc.providers.listModels.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const providers = useMemo<ProviderModels>(
    () => (data?.providers as ProviderModels | undefined) ?? EMPTY_PROVIDERS,
    [data?.providers]
  );

  const grouped = useMemo(
    () =>
      Object.entries(providers)
        .filter(([, provider]) => provider.configured)
        .map(([id, provider]) => ({ id: id as ProviderId, ...provider })),
    [providers]
  );

  const hasModels = grouped.some((entry) => entry.models.length > 0);
  const hasConfig = grouped.some((entry) => entry.configured);
  const currentAvailable = value ? isAvailable(value, providers) : true;
  const selectValue = currentAvailable ? asValue(value) : NO_DEFAULT_VALUE;
  const helperText = !hasConfig
    ? "No providers configured. Add a key in Settings to enable model defaults."
    : !hasModels
      ? "No models returned. Verify provider credentials or try again later."
      : "";

  useEffect(() => {
    if (value && !currentAvailable && hasModels) {
      onChange(undefined);
    }
  }, [value, currentAvailable, hasModels, onChange]);

  const handleChange = (next: string) => {
    if (next === NO_DEFAULT_VALUE) {
      onChange(undefined);
      return;
    }
    const [provider, model] = next.split(":");
    if (provider && model) {
      onChange({ provider, model });
    }
  };

  return (
    <div className="space-y-2">
      <Select
        value={selectValue}
        onValueChange={handleChange}
        disabled={disabled || isLoading || !hasConfig || !hasModels}
      >
        <SelectTrigger aria-label="Default model">
          <SelectValue placeholder="Select default model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_DEFAULT_VALUE}>No default</SelectItem>
          {grouped.map((entry, index) => (
            <SelectGroup key={entry.id}>
              <SelectLabel className="capitalize">{entry.id}</SelectLabel>
              {entry.models.map((model) => (
                <SelectItem key={`${entry.id}:${model.id}`} value={`${entry.id}:${model.id}`}>
                  {formatLabel(model)}
                </SelectItem>
              ))}
              {index < grouped.length - 1 ? <SelectSeparator /> : null}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className={cn("border-dashed", !value && "border-muted")}>
          {value ? `${value.provider}: ${value.model}` : "No default"}
        </Badge>
        {isLoading ? <span>Loading models…</span> : null}
        {helperText ? <span>{helperText}</span> : null}
        {isError ? (
          <span className="inline-flex items-center gap-1 text-destructive">
            <TriangleAlert className="h-3 w-3" />
            Failed to load models.
          </span>
        ) : null}
        {!currentAvailable && value ? (
          <span className="inline-flex items-center gap-1 text-destructive">
            <TriangleAlert className="h-3 w-3" />
            Model unavailable. Select a different default.
          </span>
        ) : null}
        {isError ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}
