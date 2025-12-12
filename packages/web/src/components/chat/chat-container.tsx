// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { MessageRole, WorkflowMessage } from "@choragen/core";
import { cn } from "@/lib/utils";
import { useWorkflowMessages } from "@/hooks/use-workflow-messages";
import { subscribeToAgentStream } from "@/lib/agent-stream";
import { trpc } from "@/lib/trpc/client";
import type { ToolCall } from "./tool-call-display";

import { AgentErrorMessage, ErrorMessage, type AgentErrorType, type ErrorMessageVariant } from "./error-message";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { MessageSkeleton } from "./message-skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

const DEFAULT_STAGE_INDEX = 0;

type ToolCallMetadata = ToolCall & { args: unknown };

export interface ChatContainerProps {
  workflowId: string;
  initialMessages?: WorkflowMessage[];
  stageIndex?: number;
  role?: MessageRole;
  agentRole?: "impl" | "control";
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
  agentRole = "impl",
  className,
}: ChatContainerProps) {
  const {
    messages: liveMessages,
    isLoading,
    error,
    reconnect,
  } = useWorkflowMessages(workflowId, initialMessages);
  const utils = trpc.useUtils();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [agentError, setAgentError] = useState<{ type: AgentErrorType; message: string } | null>(null);
  const [isAgentRetrying, setIsAgentRetrying] = useState(false);
  const [toolCallMessages, setToolCallMessages] = useState<WorkflowMessage[]>([]);
  const hasInitializedMessages = useRef(false);
  const lastInvokedMessageRef = useRef<string | null>(null);
  const lastHumanMessageRef = useRef<string | null>(null);
  const sortedMessages = useMemo(
    () => sortMessagesByTimestamp([...(liveMessages ?? []), ...toolCallMessages]),
    [liveMessages, toolCallMessages]
  );
  const invokeAgent = trpc.workflow.invokeAgent.useMutation({
    onSuccess: (session) => {
      setActiveSessionId(session.sessionId);
      setIsAgentTyping(true);
      setAgentError(null);
    },
    onError: (mutationError) => {
      setIsAgentTyping(false);
      setAgentError(parseAgentError(mutationError));
    },
  });

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

  useEffect(() => {
    if (!sortedMessages.length) {
      return;
    }

    const latest = sortedMessages[sortedMessages.length - 1];
    const latestId = latest.id ?? `${latest.timestamp}-${latest.role}-${latest.content}`;

    if (!hasInitializedMessages.current) {
      hasInitializedMessages.current = true;
      if (latest.role === "human") {
        lastInvokedMessageRef.current = latestId;
        lastHumanMessageRef.current = latest.content;
      }
      return;
    }

    if (latest.role !== "human") {
      return;
    }

    lastHumanMessageRef.current = latest.content;

    if (lastInvokedMessageRef.current === latestId) {
      return;
    }

    if (activeSessionId || invokeAgent.isPending) {
      lastInvokedMessageRef.current = latestId;
      return;
    }

    lastInvokedMessageRef.current = latestId;
    setIsAgentTyping(true);
    invokeAgent.mutate({
      workflowId,
      message: latest.content,
    });
  }, [activeSessionId, invokeAgent, sortedMessages, workflowId]);

  useEffect(() => {
    if (!activeSessionId) {
      return undefined;
    }

    setToolCallMessages([]);
    setIsAgentTyping(true);

    const unsubscribe = subscribeToAgentStream(activeSessionId, {
      onMessage: () => setIsAgentTyping(false),
      onToolCall: (call) => {
        setIsAgentTyping(true);
        const callId = call.id ?? `tool-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const callRecord: ToolCall = {
          id: callId,
          name: call.name ?? "tool",
          args: typeof call.args === "undefined" ? {} : call.args,
          status: call.status === "error" ? "error" : "pending",
        };
        const toolCallEntry: ToolCallMetadata = {
          ...callRecord,
          args: callRecord.args ?? {},
        };

        setToolCallMessages((current) => {
          const existingIndex = current.findIndex(
            (message) =>
              message.metadata?.type === "tool_call" &&
              (message.metadata.toolCalls?.[0] as ToolCall | undefined)?.id === callId
          );

          const message: WorkflowMessage = {
            id: `${activeSessionId}-tool-${callId}`,
            role: agentRole,
            content: callRecord.name,
            stageIndex,
            timestamp: new Date(),
            metadata: {
              type: "tool_call",
              toolCalls: [toolCallEntry],
            },
          };

          if (existingIndex >= 0) {
            const updated = [...current];
            updated[existingIndex] = message;
            return updated;
          }

          return [...current, message];
        });
      },
      onToolResult: (result) => {
        setIsAgentTyping(true);
        setToolCallMessages((current) =>
          current.map((message) => {
            if (message.metadata?.type !== "tool_call") {
              return message;
            }
            const toolCall = message.metadata.toolCalls?.[0] as ToolCallMetadata | undefined;
            if (!toolCall) {
              return message;
            }

            const callId = result.id ?? toolCall.id;
            if (callId && toolCall.id !== callId) {
              return message;
            }

            const nextStatus =
              result.status === "error" || (typeof result.error === "string" && result.error.length > 0)
                ? "error"
                : "success";

            const updatedCall: ToolCallMetadata = {
              ...toolCall,
              id: callId ?? toolCall.id,
              status: nextStatus,
              args: toolCall.args ?? {},
              result: "result" in result ? result.result : result,
            };

            return {
              ...message,
              metadata: {
                ...message.metadata,
                toolCalls: [updatedCall],
              },
            };
          })
        );
      },
      onError: (streamError) => {
        setIsAgentTyping(false);
        setActiveSessionId(null);
        setToolCallMessages([]);
        setAgentError(parseAgentError(streamError));
      },
      onDone: () => {
        setIsAgentTyping(false);
        setActiveSessionId(null);
        setToolCallMessages([]);
        setAgentError(null);
        utils.workflow.get.invalidate(workflowId);
        utils.workflow.list.invalidate();
      },
    });

    return () => {
      unsubscribe();
    };
  }, [activeSessionId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ sessionId?: string }>;
      const sessionId = custom.detail?.sessionId;
      if (!sessionId) return;
      setActiveSessionId(sessionId);
      setIsAgentTyping(true);
    };

    window.addEventListener("agent-session-started", handler as EventListener);
    return () => {
      window.removeEventListener("agent-session-started", handler as EventListener);
    };
  }, []);

  const awaitingFromMessages =
    sortedMessages.length > 0 && sortedMessages[sortedMessages.length - 1].role === "human";
  const typingIndicator =
    !isLoading && !error && (isAwaitingResponse || awaitingFromMessages || isAgentTyping) ? (
      <TypingIndicator alignment="left" role={agentRole} />
  ) : null;

  const latestHumanMessage = lastHumanMessageRef.current ?? undefined;

  const handleAgentRetry = async () => {
    setAgentError(null);
    setIsAgentRetrying(true);
    setIsAgentTyping(true);
    try {
      await invokeAgent.mutateAsync({
        workflowId,
        message: latestHumanMessage,
      });
    } catch (retryError) {
      setAgentError(parseAgentError(retryError));
      setIsAgentTyping(false);
    } finally {
      setIsAgentRetrying(false);
    }
  };

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
      {agentError ? (
        <AgentErrorMessage
          error={agentError}
          onRetry={handleAgentRetry}
          isRetrying={isAgentRetrying}
          onDismiss={() => setAgentError(null)}
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

function parseAgentError(error: unknown): { type: AgentErrorType; message: string } {
  const fallback: { type: AgentErrorType; message: string } = {
    type: "general",
    message: "The agent encountered an error. Try again in a moment.",
  };

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : (error as { message?: unknown })?.message && typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : null;

  if (!message) {
    return fallback;
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("api key") || normalized.includes("provider not configured")) {
    return { type: "api_key", message };
  }

  if (normalized.includes("rate limit") || normalized.includes("429")) {
    return { type: "rate_limit", message };
  }

  if (
    normalized.includes("network") ||
    normalized.includes("socket") ||
    normalized.includes("fetch") ||
    normalized.includes("connection") ||
    normalized.includes("timeout") ||
    normalized.includes("timed out")
  ) {
    if (normalized.includes("timeout") || normalized.includes("timed out")) {
      return { type: "timeout", message };
    }
    return { type: "network", message };
  }

  if (normalized.includes("crash") || normalized.includes("exit code")) {
    return { type: "agent_crash", message };
  }

  return { type: "general", message };
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
