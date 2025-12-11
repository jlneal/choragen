// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useMemo } from "react";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BacklogSelectorProps {
  onSelect: (requestId: string) => void;
  disabled?: boolean;
}

interface BacklogItem {
  id: string;
  title: string;
  status: string;
  domain?: string;
}

export function BacklogSelector({ onSelect, disabled }: BacklogSelectorProps) {
  const { data, isLoading, error, refetch, isRefetching } = trpc.backlog.list.useQuery();

  const backlogRequests: BacklogItem[] = useMemo(() => {
    if (!data) return [];
    return data
      .filter((item) => item.type === "cr")
      .map((item) => ({
        id: item.id,
        title: item.title ?? "Untitled",
        status: item.status ?? "backlog",
        domain: item.domain,
      }));
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select a backlog request</CardTitle>
          <CardDescription>Loading backlog requests…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select a backlog request</CardTitle>
          <CardDescription className="text-destructive">
            Failed to load backlog requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isRefetching}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (backlogRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select a backlog request</CardTitle>
          <CardDescription>No backlog change requests found.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a backlog request</CardTitle>
        <CardDescription>
          Start a workflow from an existing change request in the backlog.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {backlogRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between rounded-md border p-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{request.id}</span>
                <Badge variant="secondary" className="capitalize">
                  {request.status}
                </Badge>
              </div>
              <p className="text-sm font-medium text-foreground">{request.title}</p>
              {request.domain ? (
                <p className="text-xs text-muted-foreground">Domain: {request.domain}</p>
              ) : null}
            </div>
            <Button
              size="sm"
              onClick={() => onSelect(request.id)}
              disabled={disabled}
            >
              Start
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
