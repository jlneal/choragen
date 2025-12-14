// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import type { MessageRole, ModelReference } from "@choragen/core";
import type { ModelInfo } from "@choragen/core/providers";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProviderStatus } from "@/hooks/use-provider-status";
import { ProviderRequiredBanner } from "./provider-required-banner";
import { ModelSelector } from "./model-selector";

const DEFAULT_STAGE_INDEX = 0;
type ProviderModelMap = Record<"anthropic" | "openai", { configured: boolean; models: ModelInfo[] }>;
const EMPTY_PROVIDER_MODELS: ProviderModelMap = {
  anthropic: { configured: false, models: [] },
  openai: { configured: false, models: [] },
};

export interface ChatInputProps {
  workflowId: string;
  role?: MessageRole;
  stageIndex?: number;
  className?: string;
  onSent?: () => void;
}

/**
 * Build payload for workflow.sendMessage mutation.
 */
export function buildSendPayload(params: {
  workflowId: string;
  content: string;
  role?: MessageRole;
  stageIndex?: number;
  model?: ModelReference;
}) {
  const { workflowId, content, role = "human", stageIndex = DEFAULT_STAGE_INDEX, model } = params;
  const trimmed = content.trim();

  return {
    workflowId,
    role,
    content: trimmed,
    stageIndex: Math.max(DEFAULT_STAGE_INDEX, stageIndex),
    model,
  };
}

export function ChatInput({
  workflowId,
  role = "human",
  stageIndex = DEFAULT_STAGE_INDEX,
  className,
  onSent,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [providerError, setProviderError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelReference | undefined>(undefined);
  const { isConfigured, isLoading: isProviderLoading, refresh } = useProviderStatus();
  const modelsQuery = trpc.providers.listModels.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const currentModelQuery = trpc.workflow.currentModel.useQuery(
    { workflowId },
    {
      enabled: Boolean(workflowId),
    }
  );

  const groupedModels = useMemo<ProviderModelMap>(
    () => modelsQuery.data?.providers ?? EMPTY_PROVIDER_MODELS,
    [modelsQuery.data?.providers]
  );

  const sendMessage = trpc.workflow.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      onSent?.();
      setProviderError(null);
    },
    onError: (error) => {
      setProviderError(
        error?.message || "Provider unavailable. Check your settings and try again."
      );
      refresh();
    },
  });

  useEffect(() => {
    if (isConfigured) {
      setProviderError(null);
    }
  }, [isConfigured]);

  useEffect(() => {
    if (currentModelQuery.data) {
      setSelectedModel(currentModelQuery.data ?? undefined);
      return;
    }

    const firstAvailable = modelsQuery.data?.models?.[0];
    if (!selectedModel && firstAvailable) {
      setSelectedModel({ provider: firstAvailable.provider, model: firstAvailable.id });
    }
  }, [currentModelQuery.data, modelsQuery.data?.models, selectedModel]);

  const handleSend = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (message.trim().length === 0 || sendMessage.isPending || !isConfigured) {
        return;
      }

      const payload = buildSendPayload({
        workflowId,
        content: message,
        role,
        stageIndex,
        model: selectedModel,
      });

      sendMessage.mutate(payload);
    },
    [isConfigured, message, role, selectedModel, sendMessage, stageIndex, workflowId]
  );

  const isDisabled =
    !isConfigured || sendMessage.isPending || message.trim().length === 0;

  return (
    <form
      onSubmit={handleSend}
      className={cn("w-full", className)}
      aria-label="Send workflow message"
      role="form"
    >
      <div className="space-y-3">
        {!isConfigured ? (
          <ProviderRequiredBanner
            onRefresh={refresh}
            message="No LLM provider configured. Configure a provider to send messages."
          />
        ) : null}
        <div className="flex flex-col gap-2 rounded-md border bg-card p-3 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ModelSelector
              providers={groupedModels}
              value={selectedModel}
              onChange={setSelectedModel}
              disabled={!isConfigured || isProviderLoading || modelsQuery.isLoading}
              isLoading={modelsQuery.isLoading}
              hasError={modelsQuery.isError}
              onRetry={() => modelsQuery.refetch()}
            />
            <div className="flex flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center">
              <Input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Message the workflow..."
                disabled={sendMessage.isPending || !isConfigured || isProviderLoading}
                className="min-h-[44px] sm:flex-1"
                aria-label="Chat message input"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isDisabled}
                className="w-full min-h-[44px] min-w-[44px] sm:w-auto"
              >
                {sendMessage.isPending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
        {providerError ? (
          <div className="text-sm text-destructive" role="alert">
            {providerError}
          </div>
        ) : null}
      </div>
    </form>
  );
}
