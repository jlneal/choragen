// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useEffect, useRef } from "react";

import type { WorkflowMessage } from "@choragen/core";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

import { MessageItem } from "./message-item";

export interface MessageListProps {
  messages?: WorkflowMessage[];
  className?: string;
  workflowId?: string;
}

/**
 * Scroll to bottom of the container.
 */
export function scrollToBottom(container: {
  scrollHeight: number;
  clientHeight: number;
  scrollTop: number;
}) {
  const nextScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
  container.scrollTop = nextScrollTop;
}

export function MessageList({ messages, className, workflowId }: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!viewportRef.current) return;
    scrollToBottom(viewportRef.current);
  }, [messages?.length]);

  return (
    <ScrollArea
      ref={viewportRef}
      className={cn("min-h-[240px] flex-1 rounded-md border bg-card", className)}
    >
      <div className="flex flex-col gap-3 p-4">
        {(messages ?? []).map((message) => (
          <MessageItem key={message.id} message={message} workflowId={workflowId} />
        ))}
      </div>
    </ScrollArea>
  );
}
