// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md

import type { MessageRole, WorkflowMessage } from "@choragen/core";
import { cn } from "@/lib/utils";

export type MessageDisplayType = MessageRole | "error" | "gate_prompt" | "artifact" | "tool_call";

export interface MessageStyle {
  type: MessageDisplayType;
  alignmentClass: string;
  wrapperClass?: string;
  bubbleClass: string;
  textClass?: string;
  badge?: {
    label: string;
    className: string;
  };
  isSystem: boolean;
  isError: boolean;
}

export function deriveMessageType(message: WorkflowMessage): MessageDisplayType {
  if (message.metadata?.type === "error") {
    return "error";
  }
  if (message.metadata?.type === "gate_prompt") {
    return "gate_prompt";
  }
  if (message.metadata?.type === "artifact") {
    return "artifact";
  }
  if (message.metadata?.type === "tool_call") {
    return "tool_call";
  }
  return message.role;
}

function badgeClassName(type: MessageDisplayType): string | undefined {
  switch (type) {
    case "control":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-800";
    case "impl":
      return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-100 dark:border-purple-800";
    case "system":
      return "bg-muted text-muted-foreground";
    default:
      return undefined;
  }
}

function bubbleClass(type: MessageDisplayType): string {
  switch (type) {
    case "human":
      return "bg-primary text-primary-foreground border border-primary/60";
    case "control":
      return "bg-card text-foreground border border-blue-200/60 dark:border-blue-800/60";
    case "impl":
      return "bg-card text-foreground border border-purple-200/60 dark:border-purple-800/60";
    case "system":
      return "bg-muted text-muted-foreground border border-transparent text-center";
    case "error":
      return "bg-destructive/10 text-destructive border border-destructive shadow-sm";
    case "gate_prompt":
      return "bg-background text-foreground border border-primary shadow-sm";
    case "artifact":
      return "bg-card text-foreground border border-primary/60";
    case "tool_call":
      return "bg-muted/60 text-foreground border border-muted";
    default:
      return "bg-card text-foreground border";
  }
}

function alignment(type: MessageDisplayType): string {
  switch (type) {
    case "human":
      return "justify-end";
    case "system":
    case "error":
    case "gate_prompt":
    case "artifact":
    case "tool_call":
      return "justify-center";
    default:
      return "justify-start";
  }
}

function wrapperOffset(type: MessageDisplayType): string | undefined {
  if (type === "impl") {
    return "pl-6";
  }
  return undefined;
}

export function getMessageStyle(message: WorkflowMessage): MessageStyle {
  const type = deriveMessageType(message);
  const alignmentClass = alignment(type);
  const wrapperClass = wrapperOffset(type);
  const badge = badgeClassName(type)
    ? {
        label: type === "impl" ? "Impl" : type === "control" ? "Control" : "System",
        className: badgeClassName(type) as string,
      }
    : undefined;

  return {
    type,
    alignmentClass,
    wrapperClass,
    bubbleClass: cn(
      "max-w-[720px] rounded-lg p-3 shadow-sm",
      type === "system" ? "text-sm" : "text-sm",
      bubbleClass(type)
    ),
    textClass: type === "system" ? "text-muted-foreground text-center" : undefined,
    badge,
    isSystem: type === "system",
    isError: type === "error",
  };
}
