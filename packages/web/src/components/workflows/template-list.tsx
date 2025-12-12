// ADR: ADR-011-web-api-architecture
"use client";

import { Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TemplateCard,
  TemplateCardSkeleton,
  type WorkflowTemplateItem,
} from "./template-card";

interface TemplateListProps {
  templates: WorkflowTemplateItem[];
  isLoading?: boolean;
  onDelete: (template: WorkflowTemplateItem) => void;
  onDuplicate: (template: WorkflowTemplateItem) => void;
  deletingName?: string;
  duplicatingName?: string;
}

function TemplateListEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="rounded-full bg-muted p-4">
          <Wrench className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">No templates yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Create your first workflow template to standardize how agents move through design,
            implementation, and review stages.
          </p>
        </div>
        <Button asChild>
          <a href="/workflows/new">Create template</a>
        </Button>
      </CardContent>
    </Card>
  );
}

export function TemplateList({
  templates,
  isLoading = false,
  onDelete,
  onDuplicate,
  deletingName,
  duplicatingName,
}: TemplateListProps) {
  if (isLoading && templates.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <TemplateCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!isLoading && templates.length === 0) {
    return <TemplateListEmpty />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <TemplateCard
          key={template.name}
          template={template}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          isDeleting={deletingName === template.name}
          isDuplicating={duplicatingName === template.name}
        />
      ))}
    </div>
  );
}

export type { WorkflowTemplateItem } from "./template-card";
