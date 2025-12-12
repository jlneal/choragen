// ADR: ADR-010-agent-runtime-architecture
// Design doc: docs/design/core/features/agent-runtime.md

export interface AgentStreamHandlers {
  onMessage: (content: string | Record<string, unknown>) => void;
  onToolCall: (call: { id?: string; name?: string; args?: unknown; status?: string }) => void;
  onToolResult: (result: { id?: string; result?: unknown; status?: string; [key: string]: unknown }) => void;
  onError: (error: string) => void;
  onDone: (exitCode: number | null) => void;
}

function safeParse(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function subscribeToAgentStream(
  sessionId: string,
  handlers: AgentStreamHandlers
): () => void {
  const eventSource = new EventSource(`/api/agent-stream?sessionId=${encodeURIComponent(sessionId)}`);

  const handleMessage = (event: MessageEvent) => {
    const parsed = safeParse(event.data);
    handlers.onMessage(parsed as Record<string, unknown>);
  };

  const handleToolCall = (event: MessageEvent) => {
    const parsed = safeParse(event.data) as Record<string, unknown>;
    handlers.onToolCall({
      id: asString(parsed?.id),
      name: asString(parsed?.name),
      args: parsed?.arguments ?? parsed?.args,
      status: asString(parsed?.status),
    });
  };

  const handleToolResult = (event: MessageEvent) => {
    const parsed = safeParse(event.data) as Record<string, unknown>;
    handlers.onToolResult({
      id: asString(parsed?.id),
      result: "result" in parsed ? parsed.result : parsed,
      status: asString(parsed?.status),
      ...parsed,
    });
  };

  const handleError = (event: MessageEvent) => {
    const payload = safeParse(event.data);
    const message =
      typeof payload === "string"
        ? payload
        : typeof payload === "object" && payload && "message" in payload && typeof (payload as { message?: unknown }).message === "string"
          ? (payload as { message: string }).message
          : String(event);
    handlers.onError(message);
  };

  const handleDone = (event: MessageEvent) => {
    const parsed = safeParse(event.data);
    const exitCode =
      typeof parsed === "object" && parsed && "exitCode" in parsed && typeof (parsed as { exitCode?: unknown }).exitCode === "number"
        ? (parsed as { exitCode: number }).exitCode
        : null;
    handlers.onDone(exitCode);
    eventSource.close();
  };

  eventSource.onmessage = handleMessage;
  eventSource.addEventListener("tool_call", handleToolCall);
  eventSource.addEventListener("tool_result", handleToolResult);
  eventSource.addEventListener("error", handleError as EventListener);
  eventSource.addEventListener("done", handleDone);

  return () => {
    eventSource.close();
  };
}
