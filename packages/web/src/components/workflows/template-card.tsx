// ADR: ADR-011-web-api-architecture
"use client";

import Link from "next/link";
import { Copy, Eye, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface WorkflowTemplateItem {
  name: string;
  displayName?: string;
  description?: string;
  builtin: boolean;
  version: number;
  stages: { name: string }[];
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateCardProps {
  template: WorkflowTemplateItem;
  onDelete: (template: WorkflowTemplateItem) => void;
  onDuplicate: (template: WorkflowTemplateItem) => void;
  isDeleting?: boolean;
  isDuplicating?: boolean;
}

function formatDate(date: Date): string {
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function TemplateCard({
  template,
  onDelete,
  onDuplicate,
  isDeleting = false,
  isDuplicating = false,
}: TemplateCardProps) {
  const stageCount = template.stages.length;
  const lastUpdated = formatDate(template.updatedAt);

  return (
    <Card className={cn("h-full", template.builtin ? "border-dashed" : undefined)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg leading-tight">
              {template.displayName || template.name}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              {template.name}
            </CardDescription>
          </div>
          {template.builtin ? (
            <Badge variant="secondary">Built-in</Badge>
          ) : (
            <Badge variant="outline">Custom</Badge>
          )}
        </div>
        {template.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {template.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3 text-sm text-muted-foreground">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide">Stages</p>
          <p className="text-base font-semibold text-foreground">{stageCount}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide">Version</p>
          <p className="text-base font-semibold text-foreground">
            v{template.version}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide">Last updated</p>
          <p className="text-base font-semibold text-foreground">{lastUpdated}</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/workflows/${template.name}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>
        <Button
          asChild
          variant="secondary"
          size="sm"
          disabled={template.builtin}
        >
          <Link href={`/workflows/${template.name}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDuplicate(template)}
          disabled={isDuplicating}
        >
          <Copy className="mr-2 h-4 w-4" />
          {isDuplicating ? "Duplicating..." : "Duplicate"}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(template)}
          disabled={template.builtin || isDeleting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function TemplateCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="h-4 w-28 rounded bg-muted/70" />
        </div>
        <div className="h-4 w-full rounded bg-muted/70" />
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-3 w-20 rounded bg-muted/70" />
            <div className="h-5 w-12 rounded bg-muted" />
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <div className="h-9 w-20 rounded-md bg-muted" />
        <div className="h-9 w-20 rounded-md bg-muted/80" />
        <div className="h-9 w-24 rounded-md bg-muted/80" />
        <div className="h-9 w-24 rounded-md bg-muted/60" />
      </CardFooter>
    </Card>
  );
}
