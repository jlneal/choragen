// ADR: ADR-011-web-api-architecture
"use client";

import { useMemo } from "react";

import type { ModelReference } from "@choragen/core";
import type { ModelInfo } from "@choragen/core/providers";
import { RotateCw, TriangleAlert } from "lucide-react";

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
import { Button } from "@/components/ui/button";

type ProviderModels = Record<string, { configured: boolean; models: ModelInfo[] }>;

interface ModelSelectorProps {
  providers: ProviderModels;
  value?: ModelReference;
  onChange: (model?: ModelReference) => void;
  disabled?: boolean;
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
}

function formatModelLabel(model: ModelInfo): string {
  return model.name || model.id;
}

export function ModelSelector({
  providers,
  value,
  onChange,
  disabled,
  isLoading,
  hasError,
  onRetry,
}: ModelSelectorProps) {
  const options = useMemo(() => {
    return Object.entries(providers)
      .filter(([, provider]) => provider.configured && provider.models.length > 0)
      .map(([providerId, provider]) => ({
        providerId,
        models: provider.models,
      }));
  }, [providers]);

  const currentValue = value ? `${value.provider}:${value.model}` : undefined;
  const hasModels = options.some((option) => option.models.length > 0);
  const isSelectorDisabled = disabled || isLoading || !hasModels;
  const placeholder = !hasModels
    ? "No models available"
    : isLoading
      ? "Loading models..."
      : "Select model";

  return (
    <div className="w-full sm:max-w-xs">
      <Select
        disabled={isSelectorDisabled}
        value={currentValue}
        onValueChange={(next) => {
          const [provider, model] = next.split(":");
          if (provider && model) {
            onChange({ provider, model });
          }
        }}
      >
        <SelectTrigger aria-label="Select model">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <SelectItem value="__none" disabled>
              No models available
            </SelectItem>
          ) : (
            options.map((option, index) => (
              <SelectGroup key={option.providerId}>
                <SelectLabel className="capitalize">{option.providerId}</SelectLabel>
                {option.models.map((model) => (
                  <SelectItem key={`${option.providerId}:${model.id}`} value={`${option.providerId}:${model.id}`}>
                    {formatModelLabel(model)}
                  </SelectItem>
                ))}
                {index < options.length - 1 ? <SelectSeparator /> : null}
              </SelectGroup>
            ))
          )}
        </SelectContent>
      </Select>
      {hasError ? (
        <div className="mt-1 flex items-center justify-between gap-2 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">
          <span className="inline-flex items-center gap-1">
            <TriangleAlert className="h-3 w-3" />
            Failed to load models
          </span>
          {onRetry ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onRetry()}
            >
              <RotateCw className="mr-1 h-3 w-3" />
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
