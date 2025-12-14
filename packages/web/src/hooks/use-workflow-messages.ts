// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { WorkflowMessage } from "@choragen/core";
import { trpc } from "@/lib/trpc/client";

const RECONNECT_DELAY_MS = 1000;

function sortMessages(messages: WorkflowMessage[]): WorkflowMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

interface SubscriptionMessage {
  id: string;
  role: string;
  content: string;
  stageIndex: number;
  timestamp: string | Date;
  metadata?: Record<string, unknown>;
   model?: WorkflowMessage["model"];
}

function normalizeMessage(message: SubscriptionMessage): WorkflowMessage {
  return {
    ...message,
    role: message.role as WorkflowMessage["role"],
    timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp),
  };
}

function dedupeMessages(existing: WorkflowMessage[], next: SubscriptionMessage): WorkflowMessage[] {
  const exists = existing.some((message) => message.id === next.id);
  if (exists) {
    return existing;
  }
  return sortMessages([...existing, normalizeMessage(next)]);
}

export function useWorkflowMessages(
  workflowId: string,
  initialMessages?: WorkflowMessage[]
): {
  messages: WorkflowMessage[];
  isLoading: boolean;
  error: Error | null;
  reconnect: () => void;
} {
  const [messages, setMessages] = useState<WorkflowMessage[]>(sortMessages(initialMessages ?? []));
  const [isReady, setIsReady] = useState(initialMessages ? initialMessages.length > 0 : false);
  const [error, setError] = useState<Error | null>(null);
  const [shouldSubscribe, setShouldSubscribe] = useState(true);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  const subscriptionInput = useMemo(() => ({ workflowId }), [workflowId]);

  useEffect(() => {
    setMessages(sortMessages(initialMessages ?? []));
    setIsReady(initialMessages ? initialMessages.length > 0 : false);
  }, [workflowId, initialMessages]);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  trpc.workflow.onMessage.useSubscription(subscriptionInput, {
    enabled: Boolean(workflowId) && shouldSubscribe,
    onData: (message) => {
      setIsReady(true);
      setError(null);
      setMessages((current) => dedupeMessages(current, message));
    },
    onError: (subscriptionError) => {
      setIsReady(true);
      const err = subscriptionError instanceof Error ? subscriptionError : new Error(String(subscriptionError));
      setError(err);
      setShouldSubscribe(false);

      const isNotFound =
        err.message.includes("not found") ||
        err.message.includes("NOT_FOUND") ||
        (subscriptionError &&
          typeof subscriptionError === "object" &&
          "data" in subscriptionError &&
          (subscriptionError as { data?: { code?: string } }).data?.code === "NOT_FOUND");

      if (isNotFound) {
        return;
      }

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      retryTimerRef.current = setTimeout(() => {
        setShouldSubscribe(true);
      }, RECONNECT_DELAY_MS);
    },
  });

  return {
    messages,
    isLoading: !isReady,
    error,
    reconnect: () => setShouldSubscribe(true),
  };
}

export { sortMessages, dedupeMessages };
