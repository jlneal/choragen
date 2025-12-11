// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useCallback, useState, type FormEvent } from "react";

import type { MessageRole } from "@choragen/core";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  const sendMessage = trpc.workflow.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      onSent?.();
    },
  });

  const handleSend = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (message.trim().length === 0 || sendMessage.isPending) {
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
    [message, role, sendMessage, stageIndex, workflowId]
  );

  const isDisabled = sendMessage.isPending || message.trim().length === 0;

  return (
    <form
      onSubmit={handleSend}
      className={className}
      aria-label="Send workflow message"
      role="form"
    >
      <div className="flex items-center gap-2 rounded-md border bg-card p-3">
        <Input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Message the workflow..."
          disabled={sendMessage.isPending}
          aria-label="Chat message input"
        />
        <Button type="submit" size="sm" disabled={isDisabled}>
          {sendMessage.isPending ? "Sending..." : "Send"}
        </Button>
      </div>
    </form>
  );
}
