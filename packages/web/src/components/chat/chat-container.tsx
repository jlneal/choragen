// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useEffect, useMemo, useState } from "react";

import type { MessageRole, WorkflowMessage } from "@choragen/core";
import { cn } from "@/lib/utils";
import { useWorkflowMessages } from "@/hooks/use-workflow-messages";

import { ErrorMessage, type ErrorMessageVariant } from "./error-message";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { MessageSkeleton } from "./message-skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const {
    messages: liveMessages,
    isLoading,
    error,
    reconnect,
  } = useWorkflowMessages(workflowId, initialMessages);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const sortedMessages = useMemo(() => sortMessagesByTimestamp(liveMessages ?? []), [liveMessages]);

  const errorDetails = useMemo(
    () => mapErrorToDetails(error),
    [error]
  );

  const shouldShowError = Boolean(error && errorDetails && !isDismissed);

  useEffect(() => {
    setIsRetrying(false);
    if (error) {
      setIsDismissed(false);
    }
  }, [error]);

  const handleRetry = () => {
    setIsRetrying(true);
    reconnect();
  };

  useEffect(() => {
    if (!sortedMessages.length) {
      setIsAwaitingResponse(false);
      return;
    }

    const latest = sortedMessages[sortedMessages.length - 1];
    setIsAwaitingResponse(latest.role === "human");
  }, [sortedMessages]);

  const awaitingFromMessages =
    sortedMessages.length > 0 && sortedMessages[sortedMessages.length - 1].role === "human";
  const typingIndicator = !isLoading && !error && (isAwaitingResponse || awaitingFromMessages) ? (
    <TypingIndicator />
  ) : null;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col gap-3 overflow-hidden pb-24 md:pb-0",
        className
      )}
    >
      {shouldShowError && errorDetails ? (
        <ErrorMessage
          variant={errorDetails.variant}
          title={errorDetails.title}
          message={errorDetails.message}
          retryLabel={errorDetails.retryLabel}
          autoRetry={errorDetails.autoRetry}
          onRetry={handleRetry}
          isRetrying={isRetrying}
          onDismiss={() => setIsDismissed(true)}
        />
      ) : null}
      {isLoading ? (
        <ScrollArea className="min-h-[240px] flex-1 rounded-md border bg-card overflow-x-hidden">
          <div className="flex flex-col gap-3 p-4">
            <MessageSkeleton alignment="left" />
            <MessageSkeleton alignment="right" />
            <MessageSkeleton alignment="left" />
          </div>
        </ScrollArea>
      ) : (
        <MessageList messages={sortedMessages} workflowId={workflowId} footerContent={typingIndicator} />
      )}
      <div className="sticky bottom-0 left-0 right-0 z-10 border-t border-border bg-background/95 px-1 pb-2 pt-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur md:static md:border-0 md:bg-transparent md:pb-0 md:pt-0 md:shadow-none md:backdrop-blur-none">
        <ChatInput
          workflowId={workflowId}
          role={role}
          stageIndex={stageIndex}
          className="max-w-none"
          onSent={() => setIsAwaitingResponse(true)}
        />
      </div>
    </div>
  );
}

function mapErrorToDetails(
  error: Error | null
): {
  variant: ErrorMessageVariant;
  title: string;
  message: string;
  retryLabel: string;
  autoRetry: boolean;
} | null {
  if (!error) {
    return null;
  }

  if (isLikelyNetworkError(error)) {
    return {
      variant: "network",
      title: "Connection lost",
      message: "We lost connection to the workflow stream. We will retry automatically.",
      retryLabel: "Retry now",
      autoRetry: true,
    };
  }

  if (isLikelyApiError(error)) {
    return {
      variant: "api",
      title: "Unable to load messages",
      message: "The workflow service responded with an error. Please try again.",
      retryLabel: "Retry",
      autoRetry: false,
    };
  }

  return {
    variant: "general",
    title: "Something went wrong",
    message: "We could not load new messages. Retry in a moment.",
    retryLabel: "Retry",
    autoRetry: false,
  };
}

function isLikelyNetworkError(error: Error): boolean {
  const message = error.message.toLowerCase();

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }

  return (
    message.includes("network") ||
    message.includes("socket") ||
    message.includes("websocket") ||
    message.includes("fetch") ||
    message.includes("connection")
  );
}

function isLikelyApiError(error: Error): boolean {
  const name = (error.name ?? "").toLowerCase();
  const message = error.message.toLowerCase();

  return (
    name.includes("trpc") ||
    name.includes("api") ||
    name.includes("http") ||
    message.includes("server") ||
    message.includes("request")
  );
}
