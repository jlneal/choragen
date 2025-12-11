// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import type { MessageRole } from "@choragen/core";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProviderStatus } from "@/hooks/use-provider-status";
import { ProviderRequiredBanner } from "./provider-required-banner";

const DEFAULT_STAGE_INDEX = 0;

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
}) {
  const { workflowId, content, role = "human", stageIndex = DEFAULT_STAGE_INDEX } = params;
  const trimmed = content.trim();

  return {
    workflowId,
    role,
    content: trimmed,
    stageIndex: Math.max(DEFAULT_STAGE_INDEX, stageIndex),
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
  const { isConfigured, isLoading: isProviderLoading, refresh } = useProviderStatus();

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
      });

      sendMessage.mutate(payload);
    },
    [isConfigured, message, role, sendMessage, stageIndex, workflowId]
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
        <div className="flex flex-col gap-2 rounded-md border bg-card p-3 shadow-sm sm:flex-row sm:items-center">
          <Input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Message the workflow..."
            disabled={sendMessage.isPending || !isConfigured || isProviderLoading}
            className="min-h-[44px]"
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
        {providerError ? (
          <div className="text-sm text-destructive" role="alert">
            {providerError}
          </div>
        ) : null}
      </div>
    </form>
  );
}
