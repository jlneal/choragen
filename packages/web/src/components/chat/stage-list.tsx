// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md

import { CheckCircle, Circle, Clock } from "lucide-react";

import { cn } from "@/lib/utils";

export interface WorkflowStageDisplay {
  name: string;
  type?: string;
  status?: string;
}

interface StageListProps {
  stages: WorkflowStageDisplay[];
  currentStageIndex?: number;
}

function getStageState(stage: WorkflowStageDisplay, index: number, current?: number) {
  if (typeof current === "number") {
    if (index < current) return "completed" as const;
    if (index === current) return "current" as const;
  }
  if (stage.status === "completed") return "completed" as const;
  if (stage.status === "active" || stage.status === "running") return "current" as const;
  return "upcoming" as const;
}

export function StageList({ stages, currentStageIndex }: StageListProps) {
  return (
    <div className="space-y-2">
      {stages.map((stage, index) => {
        const state = getStageState(stage, index, currentStageIndex);
        const isCompleted = state === "completed";
        const isCurrent = state === "current";
        const Icon = isCompleted ? CheckCircle : isCurrent ? Clock : Circle;
        return (
          <div
            key={`${stage.name}-${index}`}
            className={cn(
              "flex items-center justify-between rounded-md border p-2 text-sm",
              isCompleted
                ? "border-green-200 dark:border-green-800/60"
                : isCurrent
                  ? "border-primary/40"
                  : "border-muted"
            )}
          >
            <div className="flex items-center gap-2">
              <Icon
                className={cn(
                  "h-4 w-4",
                  isCompleted
                    ? "text-green-500"
                    : isCurrent
                      ? "text-primary"
                      : "text-muted-foreground"
                )}
              />
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{stage.name}</span>
                {stage.type ? (
                  <span className="text-xs text-muted-foreground capitalize">{stage.type}</span>
                ) : null}
              </div>
            </div>
            {isCurrent ? (
              <span className="text-xs font-medium text-primary">In progress</span>
            ) : isCompleted ? (
              <span className="text-xs text-muted-foreground">Done</span>
            ) : (
              <span className="text-xs text-muted-foreground">Pending</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
