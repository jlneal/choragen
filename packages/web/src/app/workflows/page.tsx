// ADR: ADR-011-web-api-architecture
"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { AlertTriangle, Filter, Plus, RefreshCcw, Search } from "lucide-react";

import { TemplateList, type WorkflowTemplateItem } from "@/components/workflows/template-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";

type TemplateFilter = "all" | "builtin" | "custom";

interface TemplateResponse {
  name: string;
  displayName?: string;
  description?: string;
  builtin: boolean;
  version: number;
  stages: { name: string }[];
  createdAt: string;
  updatedAt: string;
}

function parseDate(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toTemplateItem(template: TemplateResponse): WorkflowTemplateItem {
  return {
    ...template,
    stages: template.stages ?? [],
    createdAt: parseDate(template.createdAt),
    updatedAt: parseDate(template.updatedAt),
  };
}

export default function WorkflowsPage() {
  const [filter, setFilter] = useState<TemplateFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<WorkflowTemplateItem | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<WorkflowTemplateItem | null>(null);
  const [duplicateName, setDuplicateName] = useState("");

  const {
    data,
    isLoading,
    error,
    refetch,
  } = trpc.workflowTemplates.list.useQuery();

  const deleteMutation = trpc.workflowTemplates.delete.useMutation({
    onSuccess: async () => {
      setDeleteTarget(null);
      await refetch();
    },
  });

  const duplicateMutation = trpc.workflowTemplates.duplicate.useMutation({
    onSuccess: async () => {
      setDuplicateTarget(null);
      setDuplicateName("");
      await refetch();
    },
  });

  const templates = useMemo(
    () => ((data as TemplateResponse[] | undefined) ?? []).map(toTemplateItem),
    [data]
  );

  const filteredTemplates = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return templates.filter((template) => {
      if (filter === "builtin" && !template.builtin) return false;
      if (filter === "custom" && template.builtin) return false;

      if (!query) return true;
      const haystack = `${template.name} ${template.displayName ?? ""} ${template.description ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [filter, searchTerm, templates]);

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate({ name: deleteTarget.name });
  };

  const handleDuplicateConfirm = () => {
    if (!duplicateTarget || !duplicateName.trim()) return;
    duplicateMutation.mutate({
      sourceName: duplicateTarget.name,
      newName: duplicateName.trim(),
    });
  };

  const isDeletingName = deleteTarget ? deleteTarget.name : undefined;
  const isDuplicatingName = duplicateTarget ? duplicateTarget.name : undefined;

  const showError = Boolean(error);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Workflow Templates</h1>
          <p className="text-muted-foreground">
            Browse, duplicate, and manage built-in and custom workflow templates.
          </p>
        </div>
        <div className="flex w-full justify-end sm:w-auto">
          <Button asChild>
            <Link href="/workflows/new">
              <Plus className="h-4 w-4" />
              Create Template
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filter by template type</span>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="inline-flex overflow-hidden rounded-md border bg-muted/40 p-1">
              {(["all", "builtin", "custom"] as TemplateFilter[]).map((option) => {
                const isActive = filter === option;
                return (
                  <Button
                    key={option}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="capitalize"
                    onClick={() => setFilter(option)}
                  >
                    {option}
                  </Button>
                );
              })}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search templates..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showError ? (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-destructive/10 p-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-destructive">Unable to load templates</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Check your connection and try again.
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => void refetch()}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </CardHeader>
            </Card>
          ) : (
            <TemplateList
              templates={filteredTemplates}
              isLoading={isLoading}
              onDelete={(template) => setDeleteTarget(template)}
              onDuplicate={(template) => {
                setDuplicateTarget(template);
                setDuplicateName(`${template.name}-copy`);
              }}
              deletingName={deleteMutation.isPending ? isDeletingName : undefined}
              duplicatingName={duplicateMutation.isPending ? isDuplicatingName : undefined}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The template will be removed from your project. Built-in templates cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate dialog */}
      <Dialog
        open={Boolean(duplicateTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDuplicateTarget(null);
            setDuplicateName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate template</DialogTitle>
            {duplicateTarget && (
              <CardDescription className="text-sm">
                Create a copy of <Badge variant="secondary">{duplicateTarget.name}</Badge> with a new name.
              </CardDescription>
            )}
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="duplicate-name">New template name</Label>
            <Input
              id="duplicate-name"
              value={duplicateName}
              onChange={(event) => setDuplicateName(event.target.value)}
              placeholder="enter-new-template-name"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDuplicateTarget(null);
              setDuplicateName("");
            }} disabled={duplicateMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleDuplicateConfirm}
              disabled={duplicateMutation.isPending || !duplicateName.trim()}
            >
              {duplicateMutation.isPending ? "Duplicating..." : "Duplicate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
