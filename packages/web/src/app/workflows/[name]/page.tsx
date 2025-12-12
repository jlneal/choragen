// ADR: ADR-011-web-api-architecture
"use client";

import { useEffect, useMemo, useState } from "react";

import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, Copy, Loader2 } from "lucide-react";

import { TemplateForm, type TemplateFormValues } from "@/components/workflows/template-form";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";

type TemplateStageResponse = TemplateFormValues["stages"][number];

interface TemplateResponse {
  name: string;
  displayName?: string;
  description?: string;
  builtin: boolean;
  version: number;
  stages: TemplateStageResponse[];
  createdAt: string;
  updatedAt: string;
}

function toFormValues(template: TemplateResponse): TemplateFormValues {
  return {
    name: template.name,
    displayName: template.displayName,
    description: template.description,
    builtin: template.builtin,
    version: template.version,
    stages: template.stages.map((stage) => ({
      ...stage,
      gate: {
        ...stage.gate,
        commands: stage.gate.commands ?? [],
      },
    })),
  };
}

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const templateName = useMemo(() => (params?.name as string) ?? "", [params]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");

  const {
    data,
    isLoading,
    error,
    refetch,
  } = trpc.workflowTemplates.get.useQuery(
    { name: templateName },
    { enabled: Boolean(templateName) }
  );

  const deleteMutation = trpc.workflowTemplates.delete.useMutation({
    onSuccess: () => {
      setDeleteOpen(false);
      router.push("/workflows");
    },
  });

  const updateMutation = trpc.workflowTemplates.update.useMutation({
    onSuccess: async () => {
      await refetch();
    },
  });

  const duplicateMutation = trpc.workflowTemplates.duplicate.useMutation({
    onSuccess: (created) => {
      setDuplicateOpen(false);
      setDuplicateName("");
      router.push(`/workflows/${created.name}`);
    },
  });

  const isBuiltIn = Boolean((data as TemplateResponse | undefined)?.builtin);
  const formValues = useMemo(
    () => (data ? toFormValues(data as TemplateResponse) : null),
    [data]
  );

  useEffect(() => {
    if (formValues && formValues.name && !duplicateName) {
      setDuplicateName(`${formValues.name}-copy`);
    }
  }, [formValues, duplicateName]);

  const handleSubmit = async (values: TemplateFormValues) => {
    if (!values.name) return;
    await updateMutation.mutateAsync({
      name: values.name,
      displayName: values.displayName,
      description: values.description,
      stages: values.stages,
      changedBy: values.changedBy,
      changeDescription: values.changeDescription,
    });
  };

  const handleDuplicate = async () => {
    if (!duplicateName.trim() || !formValues) return;
    await duplicateMutation.mutateAsync({
      sourceName: formValues.name,
      newName: duplicateName.trim(),
    });
  };

  if (isLoading || (!data && !error)) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading template...
      </div>
    );
  }

  if (error || !formValues) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-sm text-destructive">
                Unable to load template
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Check that the template exists and try again.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {formValues.displayName || formValues.name}
          </h1>
          <Badge variant="secondary" className="font-mono">
            v{formValues.version ?? 1}
          </Badge>
          {formValues.builtin && <Badge variant="outline">Built-in</Badge>}
        </div>
        <p className="text-muted-foreground">
          {formValues.description || "No description provided."}
        </p>
      </div>

      <TemplateForm
        mode="edit"
        initialTemplate={formValues}
        readOnly={isBuiltIn}
        stageEditable={!isBuiltIn}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/workflows")}
        onDelete={() => setDeleteOpen(true)}
        onDuplicate={() => setDuplicateOpen(true)}
        isSubmitting={updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
        isDuplicating={duplicateMutation.isPending}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the template from your project. Built-in templates cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate({ name: formValues.name })}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate template</DialogTitle>
            <CardDescription className="text-sm">
              Provide a new name to create a copy of this template.
            </CardDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="duplicate-name">New template name</Label>
            <Input
              id="duplicate-name"
              value={duplicateName}
              onChange={(event) => setDuplicateName(event.target.value)}
              placeholder={`${formValues.name}-copy`}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleDuplicate()}
              disabled={!duplicateName.trim() || duplicateMutation.isPending}
            >
              {duplicateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Duplicating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Duplicate
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
