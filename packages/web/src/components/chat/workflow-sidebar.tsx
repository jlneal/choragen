// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useMemo, useState } from "react";
import { BarChart2, Timer, FileCode } from "lucide-react";

import type { WorkflowMessage } from "@choragen/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { StageList, type WorkflowStageDisplay } from "./stage-list";
import { ArtifactList } from "./artifact-list";

interface WorkflowSidebarProps {
  workflowId: string;
  requestId?: string;
  status?: string;
  template?: string;
  stageSummary: string;
  updatedAt?: Date | string;
  createdAt?: Date | string;
  stages?: WorkflowStageDisplay[];
  currentStageIndex?: number;
  messages?: WorkflowSidebarMessage[];
}

type WorkflowSidebarMessage = WorkflowMessage & { timestamp: Date | string };

function calculateDurationMinutes(start?: Date | string): number | null {
  if (!start) return null;
  const startDate = start instanceof Date ? start : new Date(start);
  if (Number.isNaN(startDate.getTime())) return null;
  const diffMs = Date.now() - startDate.getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} hr`;
  return `${hours} hr ${remaining} min`;
}

function calculateProgress(stages?: WorkflowStageDisplay[], currentStageIndex?: number): number {
  if (!stages || stages.length === 0) return 0;
  if (typeof currentStageIndex === "number" && currentStageIndex >= 0) {
    return Math.round(((currentStageIndex) / stages.length) * 100);
  }
  const completed = stages.filter((stage) => stage.status === "completed").length;
  return Math.round((completed / stages.length) * 100);
}

export function WorkflowSidebar({
  workflowId,
  requestId,
  status,
  template,
  stageSummary,
  updatedAt,
  stages = [],
  currentStageIndex,
  messages,
  createdAt,
}: WorkflowSidebarProps) {
  const [collapsed, setCollapsed] = useState(true);
  const durationMinutes = useMemo(() => calculateDurationMinutes(createdAt), [createdAt]);
  const messageCount = messages?.length ?? 0;
  const progress = useMemo(
    () => calculateProgress(stages, currentStageIndex),
    [stages, currentStageIndex]
  );

  const sidebarContent = (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">Workflow details</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {status ?? "unknown"}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">{workflowId}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <SidebarItem label="Request" value={requestId ?? "Unlinked"} />
          <SidebarItem label="Template" value={template ?? "standard"} />
          <SidebarItem label="Stage" value={stageSummary} />
          <SidebarItem
            label="Last updated"
            value={
              updatedAt
                ? new Date(updatedAt).toLocaleString()
                : "Just now"
            }
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Progress</span>
            </div>
            <span className="text-sm font-semibold">{progress}%</span>
          </div>
          {stages.length > 0 ? (
            <StageList stages={stages} currentStageIndex={currentStageIndex} />
          ) : (
            <p className="text-sm text-muted-foreground">No stages defined.</p>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Artifacts</span>
          </div>
          <ArtifactList messages={messages} />
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Metrics</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <SidebarItem label="Messages" value={String(messageCount)} />
            <SidebarItem label="Duration" value={formatDuration(durationMinutes)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-2">
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="w-full rounded-md border bg-card px-3 py-2 text-left text-sm font-medium"
        >
          {collapsed ? "Show workflow sidebar" : "Hide workflow sidebar"}
        </button>
      </div>
      <div className={cn(collapsed ? "hidden lg:block" : "block")}>{sidebarContent}</div>
    </div>
  );
}

function SidebarItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
