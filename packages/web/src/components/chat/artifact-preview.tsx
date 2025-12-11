// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useMemo } from "react";
import Link from "next/link";

import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ArtifactType = "cr" | "chain" | "task" | "file" | "adr";

export interface ArtifactPreviewProps {
  artifactType: ArtifactType;
  artifactId: string;
  title?: string;
}

interface TaskIdentifier {
  chainId: string;
  taskId: string;
}

function parseTaskIdentifier(artifactId: string): TaskIdentifier | null {
  if (artifactId.includes("/")) {
    const [chainId, taskId] = artifactId.split("/");
    if (chainId && taskId) {
      return { chainId, taskId };
    }
  }
  if (artifactId.includes(":")) {
    const [chainId, taskId] = artifactId.split(":");
    if (chainId && taskId) {
      return { chainId, taskId };
    }
  }
  return null;
}

function useArtifactData(type: ArtifactType, artifactId: string) {
  const taskIdentifier = useMemo(() => parseTaskIdentifier(artifactId), [artifactId]);

  switch (type) {
    case "cr":
      return trpc.requests.get.useQuery(artifactId);
    case "chain":
      return trpc.chains.get.useQuery(artifactId);
    case "task":
      if (!taskIdentifier) {
        return { data: undefined, isLoading: false, error: null };
      }
      return trpc.tasks.get.useQuery(taskIdentifier);
    default:
      return { data: undefined, isLoading: false, error: null };
  }
}

function statusBadge(status?: string, label?: string) {
  if (!status) return null;
  return (
    <Badge variant="secondary" className="capitalize">
      {label ?? status}
    </Badge>
  );
}

export function ArtifactPreview({ artifactType, artifactId, title }: ArtifactPreviewProps) {
  const query = useArtifactData(artifactType, artifactId);

  if ("isLoading" in query && query.isLoading) {
    return (
      <Card>
        <CardContent className="p-3 text-sm text-muted-foreground">Loading artifact…</CardContent>
      </Card>
    );
  }

  if ("error" in query && query.error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center gap-2 p-3 text-sm text-destructive">
          <span>Failed to load artifact</span>
          <span className="font-mono">{artifactId}</span>
        </CardContent>
      </Card>
    );
  }

  const data = "data" in query ? query.data : undefined;

  switch (artifactType) {
    case "cr": {
      const requestRecord = (data ?? {}) as Record<string, unknown>;
      const requestId =
        typeof requestRecord.id === "string" ? requestRecord.id : artifactId;
      const requestTitle =
        typeof requestRecord.title === "string"
          ? requestRecord.title
          : title ?? "Change Request";
      const requestStatus =
        typeof requestRecord.status === "string" ? requestRecord.status : undefined;
      return (
        <Card>
          <CardContent className="space-y-2 p-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium">{requestTitle}</div>
              {statusBadge(requestStatus)}
            </div>
            <div className="flex gap-2 text-muted-foreground">
              <span className="font-mono text-xs">{requestId}</span>
              <Link href={`/requests/${requestId}`} className="text-primary underline">
                View request
              </Link>
            </div>
          </CardContent>
        </Card>
      );
    }
    case "chain": {
      const chainRecord = (data ?? {}) as Record<string, unknown>;
      const chainTitle =
        typeof chainRecord.title === "string" ? chainRecord.title : title ?? "Task Chain";
      const chainStatus =
        typeof chainRecord.status === "string" ? chainRecord.status : undefined;
      const taskCount = Array.isArray((chainRecord as { tasks?: unknown[] }).tasks)
        ? ((chainRecord as { tasks?: unknown[] }).tasks?.length ?? 0)
        : 0;
      const requestId =
        typeof (chainRecord as { requestId?: unknown }).requestId === "string"
          ? (chainRecord as { requestId?: string }).requestId
          : undefined;
      return (
        <Card>
          <CardContent className="space-y-2 p-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium">{chainTitle}</div>
              {statusBadge(chainStatus)}
            </div>
            <div className="flex flex-col gap-1 text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{artifactId}</span>
                <Link href={`/chains/${artifactId}`} className="text-primary underline">
                  Open chain
                </Link>
              </div>
              <div className="text-xs">{taskCount} tasks</div>
              {requestId ? <div className="text-xs">Request: {requestId}</div> : null}
            </div>
          </CardContent>
        </Card>
      );
    }
    case "task": {
      const taskRecord = (data ?? {}) as Record<string, unknown>;
      const chainId =
        typeof taskRecord.chainId === "string"
          ? taskRecord.chainId
          : parseTaskIdentifier(artifactId)?.chainId;
      const taskId =
        typeof taskRecord.id === "string"
          ? taskRecord.id
          : parseTaskIdentifier(artifactId)?.taskId ?? artifactId;
      const taskTitle =
        typeof taskRecord.title === "string" ? taskRecord.title : title ?? "Task";
      const taskStatus =
        typeof taskRecord.status === "string" ? taskRecord.status : undefined;
      return (
        <Card>
          <CardContent className="space-y-2 p-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium">{taskTitle}</div>
              {statusBadge(taskStatus)}
            </div>
            <div className="flex flex-col gap-1 text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{taskId}</span>
                <Link
                  href={chainId ? `/chains/${chainId}` : "/tasks"}
                  className="text-primary underline"
                >
                  View task
                </Link>
              </div>
              {chainId ? <div className="text-xs">Chain: {chainId}</div> : null}
            </div>
          </CardContent>
        </Card>
      );
    }
    case "file":
      return (
        <Card>
          <CardContent className="space-y-1 p-3 text-sm">
            <div className="font-medium">File Reference</div>
            <div className="font-mono text-xs text-muted-foreground break-all">{artifactId}</div>
            <Link href="/git" className="text-primary underline text-xs">
              Open Git view
            </Link>
          </CardContent>
        </Card>
      );
    case "adr":
      return (
        <Card>
          <CardContent className="space-y-1 p-3 text-sm">
            <div className="font-medium">Architecture Decision</div>
            <div className="font-mono text-xs text-muted-foreground">{artifactId}</div>
            <Link href={`/docs/adr/${artifactId}`} className="text-primary underline text-xs">
              View ADR
            </Link>
          </CardContent>
        </Card>
      );
    default:
      return null;
  }
}
