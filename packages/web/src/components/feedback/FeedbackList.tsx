// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/agent-feedback.md
"use client";

import type { FeedbackItem } from "@choragen/core";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackMessage } from "@/components/chat/FeedbackMessage";

interface FeedbackListProps {
  feedback: FeedbackItem[];
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  workflowId?: string;
}

export function FeedbackList({ feedback, expandedIds, onToggle, workflowId }: FeedbackListProps) {
  if (feedback.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/50 p-6 text-center text-sm text-muted-foreground">
        No feedback matches these filters yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {feedback.map((item) => {
        const isExpanded = expandedIds.has(item.id);
        return (
          <Card key={item.id} className="border border-muted shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex flex-1 flex-col gap-1">
                <CardTitle className="text-sm font-semibold text-foreground">
                  {item.content}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="capitalize">
                    {item.type}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {item.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {item.priority}
                  </Badge>
                  <span>Stage {item.stageIndex + 1}</span>
                  <span>{new Date(item.updatedAt).toLocaleString()}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => onToggle(item.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground">
                  {isExpanded ? "Hide details" : "View details"}
                </span>
              </Button>
            </CardHeader>
            {isExpanded ? (
              <CardContent className={cn("border-t bg-muted/30 p-3")}>
                <FeedbackMessage feedback={item} workflowId={workflowId} defaultOpenResponse />
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
