// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useMemo } from "react";

import type { MessageRole, WorkflowMessage } from "@choragen/core";
import { cn } from "@/lib/utils";
import { useWorkflowMessages } from "@/hooks/use-workflow-messages";

import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";

const DEFAULT_STAGE_INDEX = 0;

export interface ChatContainerProps {
  workflowId: string;
  initialMessages?: WorkflowMessage[];
  stageIndex?: number;
  role?: MessageRole;
  className?: string;
}

/**
 * Sort messages ascending by timestamp for consistent rendering.
 */
export function sortMessagesByTimestamp(messages: WorkflowMessage[]): WorkflowMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export function ChatContainer({
  workflowId,
  initialMessages,
  stageIndex = DEFAULT_STAGE_INDEX,
  role = "human",
  className,
}: ChatContainerProps) {
  const { messages: liveMessages } = useWorkflowMessages(workflowId, initialMessages);
  const sortedMessages = useMemo(() => sortMessagesByTimestamp(liveMessages ?? []), [liveMessages]);

  return (
    <div className={cn("flex h-full flex-col gap-4", className)}>
      <MessageList messages={sortedMessages} workflowId={workflowId} />
      <ChatInput workflowId={workflowId} role={role} stageIndex={stageIndex} />
    </div>
  );
}
