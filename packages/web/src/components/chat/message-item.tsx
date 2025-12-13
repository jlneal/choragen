// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md

import type { WorkflowMessage } from "@choragen/core";
import { AlertCircle, MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getMessageStyle } from "./message-styles";
import { GatePrompt } from "./gate-prompt";
import { ArtifactLink } from "./artifact-link";
import { ToolCallDisplay } from "./tool-call-display";
import { FeedbackMessage } from "./FeedbackMessage";
import type { FeedbackItem } from "@choragen/core";

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

interface MessageItemProps {
  message: WorkflowMessage;
  workflowId?: string;
}

/**
 * Format timestamp for display.
 */
export function formatMessageTimestamp(timestamp: Date | string): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderError(message: WorkflowMessage) {
  return (
    <div className="flex justify-center">
      <div className="max-w-[720px] rounded-lg border border-destructive bg-destructive/10 p-3 text-destructive shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5" />
          <div className="space-y-1">
            <p className="font-semibold">Error</p>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            <p className="text-xs">{formatMessageTimestamp(message.timestamp)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderSystem(message: WorkflowMessage, formattedTime: string) {
  const content = message.content.trim();
  return (
    <div className="flex justify-center">
      <div className="max-w-[720px] rounded-lg border border-transparent bg-muted p-3 text-center text-sm text-muted-foreground shadow-sm">
        <div className="inline-flex items-center gap-2">
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            System
          </Badge>
          <span className="whitespace-pre-wrap">{content}</span>
          <span className="text-xs">{formattedTime}</span>
        </div>
      </div>
    </div>
  );
}

export function MessageItem({ message, workflowId }: MessageItemProps) {
  const formattedTime = formatMessageTimestamp(message.timestamp);
  const style = getMessageStyle(message);

  if (style.type === "feedback" && message.metadata?.feedback) {
    const feedback = normalizeFeedbackMetadata(message.metadata.feedback);
    if (feedback) {
      return <FeedbackMessage feedback={feedback} workflowId={workflowId ?? feedback.workflowId} />;
    }
  }

  if (style.type === "tool_call" && message.metadata?.type === "tool_call") {
    const toolCalls =
      Array.isArray(message.metadata.toolCalls) && message.metadata.toolCalls.length > 0
        ? message.metadata.toolCalls.map((call) => {
            const callRecord = call as Record<string, unknown>;
            const statusValue: "pending" | "success" | "error" =
              typeof callRecord.status === "string" && callRecord.status === "error"
                ? "error"
                : typeof callRecord.status === "string" && callRecord.status === "pending"
                  ? "pending"
                  : "success";
            return {
              id: typeof callRecord.id === "string" ? callRecord.id : undefined,
              name: typeof callRecord.name === "string" ? callRecord.name : "tool",
              args: "args" in callRecord ? callRecord.args : undefined,
              result: "result" in callRecord ? callRecord.result : undefined,
              status: statusValue,
            };
          })
        : [];

    if (toolCalls.length > 0) {
      return <ToolCallDisplay toolCalls={toolCalls} />;
    }
  }

  if (style.type === "artifact" && message.metadata?.type === "artifact") {
    const artifactType = asString(message.metadata.artifactType);
    const artifactId = asString(message.metadata.artifactId);
    const artifactTitle = asString(message.metadata.title) ?? message.content;
    if (artifactType && artifactId) {
      return (
        <ArtifactLink
          artifactType={artifactType as "cr" | "chain" | "task" | "file" | "adr"}
          artifactId={artifactId}
          title={artifactTitle}
          defaultExpanded={false}
        />
      );
    }
  }

  if (style.type === "gate_prompt" && message.metadata?.type === "gate_prompt") {
    return (
      <GatePrompt
        workflowId={workflowId ?? ""}
        stageIndex={message.stageIndex}
        prompt={asString(message.metadata.prompt) ?? "Approval required"}
        gateType={message.metadata.gateType ? String(message.metadata.gateType) : undefined}
      />
    );
  }

  if (style.isError) {
    return renderError(message);
  }

  if (style.isSystem) {
    return renderSystem(message, formattedTime);
  }

  const headerTextClass =
    style.type === "human" ? "text-primary-foreground/80" : "text-muted-foreground";
  const contentTextClass =
    style.type === "human" ? "text-primary-foreground" : "text-foreground";

  return (
    <div className={`flex ${style.alignmentClass}`}>
      <div className={style.wrapperClass}>
        <div className={style.bubbleClass}>
          <div className={`flex items-center justify-between text-xs ${headerTextClass}`}>
            <span className="inline-flex items-center gap-2 font-medium capitalize">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              {style.badge ? (
                <Badge variant="secondary" className={style.badge.className}>
                  {style.badge.label}
                </Badge>
              ) : (
                "You"
              )}
            </span>
            <span>{formattedTime}</span>
          </div>
          <p className={`mt-2 whitespace-pre-wrap text-sm ${contentTextClass}`}>
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}

function normalizeFeedbackMetadata(feedback: unknown): FeedbackItem | null {
  if (!feedback || typeof feedback !== "object") return null;
  const data = feedback as Partial<FeedbackItem>;
  if (
    typeof data.id === "string" &&
    typeof data.workflowId === "string" &&
    typeof data.type === "string" &&
    typeof data.content === "string" &&
    typeof data.status === "string" &&
    typeof data.priority === "string" &&
    typeof data.stageIndex === "number" &&
    data.createdAt &&
    data.updatedAt
  ) {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      response: data.response
        ? {
            ...data.response,
            respondedAt: data.response.respondedAt
              ? new Date(data.response.respondedAt)
              : new Date(),
          }
        : undefined,
    } as FeedbackItem;
  }
  return null;
}
