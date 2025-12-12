// ADR: ADR-011-web-api-architecture
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import { VersionTable, type TemplateVersionRow } from "@/components/workflows/version-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

function parseDate(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default function TemplateVersionsPage() {
  const params = useParams();
  const templateName = params?.name as string;

  const { data, isLoading, error, refetch } =
    trpc.workflowTemplates.listVersions.useQuery(
      { name: templateName },
      { enabled: Boolean(templateName) }
    );

  const versions = useMemo<TemplateVersionRow[]>(() => {
    const list = (data as any[]) ?? [];
    return list
      .map((item) => ({
        version: item.version,
        changedBy: item.changedBy,
        changeDescription: item.changeDescription,
        createdAt: parseDate(item.createdAt),
        templateName,
      }))
      .sort((a, b) => b.version - a.version);
  }, [data, templateName]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Version history</h1>
          <p className="text-muted-foreground">
            View previous versions of the template and inspect their snapshots.
          </p>
        </div>
        <Button asChild>
          <Link href={`/workflows/${templateName}`}>
            Back to template
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Versions</CardTitle>
            <CardDescription>
              Click a version to view its snapshot or restore it.
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            {versions.length} version{versions.length === 1 ? "" : "s"}
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">Failed to load versions.</p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Loading version history...</p>
          ) : versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No versions found.</p>
          ) : (
            <VersionTable versions={versions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
