// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Terminal } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ToolCall {
  name: string;
  args?: unknown;
  result?: unknown;
  status?: "success" | "error";
}

interface ToolCallDisplayProps {
  toolCalls: ToolCall[];
  defaultExpanded?: boolean;
}

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function ToolCallDisplay({ toolCalls, defaultExpanded = false }: ToolCallDisplayProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (toolCalls.length === 0) {
    return null;
  }

  const toggle = () => setExpanded((prev) => !prev);

  return (
    <Card className="bg-muted/50 border-muted">
      <CardHeader
        className="flex cursor-pointer flex-row items-center justify-between space-y-0"
        onClick={toggle}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <span className="font-mono text-xs">
              {toolCalls.length === 1 ? toolCalls[0].name : `${toolCalls.length} tool calls`}
            </span>
          </CardTitle>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      {expanded ? (
        <CardContent className="space-y-3">
          {toolCalls.map((call, index) => {
            const isSuccess = call.status !== "error";
            return (
              <div
                key={`${call.name}-${index}`}
                className={cn(
                  "rounded-md border bg-background p-3 text-sm",
                  isSuccess ? "border-muted" : "border-destructive/50"
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{call.name}</span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isSuccess ? "text-muted-foreground" : "text-destructive"
                      )}
                    >
                      {isSuccess ? "success" : "error"}
                    </span>
                  </div>
                </div>
                {typeof call.args !== "undefined" ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Args</p>
                    <pre className="overflow-auto rounded-md bg-muted p-2 text-xs text-muted-foreground">
                      {formatJson(call.args)}
                    </pre>
                  </div>
                ) : null}
                {typeof call.result !== "undefined" ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Result</p>
                    <pre className="overflow-auto rounded-md bg-muted p-2 text-xs text-muted-foreground">
                      {formatJson(call.result)}
                    </pre>
                  </div>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      ) : null}
    </Card>
  );
}
