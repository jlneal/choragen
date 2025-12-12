// ADR: ADR-011-web-api-architecture
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { TemplateForm, type TemplateFormValues, type TemplateStageInput } from "@/components/workflows/template-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { trpc } from "@/lib/trpc/client";

function parseStage(stage: any): TemplateStageInput {
  return {
    name: stage.name,
    type: stage.type,
    roleId: stage.roleId,
    gate: {
      type: stage.gate?.type,
      prompt: stage.gate?.prompt,
      chainId: stage.gate?.chainId,
      commands: stage.gate?.commands ?? [],
      satisfied: stage.gate?.satisfied,
      satisfiedBy: stage.gate?.satisfiedBy,
      satisfiedAt: stage.gate?.satisfiedAt,
    },
    hooks: stage.hooks,
  };
}

function toTemplateFormValues(snapshot: any): TemplateFormValues {
  return {
    name: snapshot.name,
    displayName: snapshot.displayName,
    description: snapshot.description,
    builtin: snapshot.builtin,
    version: snapshot.version,
    stages: (snapshot.stages ?? []).map(parseStage),
  };
}

export default function TemplateVersionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const name = params?.name as string;
  const version = Number(params?.version);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading, error, refetch } =
    trpc.workflowTemplates.getVersion.useQuery(
      { name, version },
      { enabled: Boolean(name) && Number.isFinite(version) }
    );

  const restoreMutation = trpc.workflowTemplates.restoreVersion.useMutation({
    onSuccess: () => {
      setConfirmOpen(false);
      router.push(`/workflows/${name}`);
    },
  });

  const formValues = useMemo(
    () => (data ? toTemplateFormValues((data as any).snapshot) : null),
    [data]
  );

  const createdAt =
    data && "createdAt" in (data as any)
      ? new Date((data as any).createdAt)
      : null;

  const handleRestore = async () => {
    await restoreMutation.mutateAsync({
      name,
      version,
      changedBy: "web-ui",
    });
  };

  if (isLoading || (!data && !error)) {
    return <p className="text-sm text-muted-foreground">Loading version...</p>;
  }

  if (error || !formValues) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive text-lg">Unable to load version</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Check that the version exists and try again.
          </CardDescription>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {formValues.displayName || formValues.name}
          </h1>
          <Badge variant="secondary" className="font-mono">
            v{formValues.version}
          </Badge>
          <Badge variant="outline">Snapshot</Badge>
        </div>
        <p className="text-muted-foreground">
          Snapshot created {createdAt ? createdAt.toLocaleString() : "unknown"} by {(data as any).changedBy ?? "unknown"}.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/workflows/${name}/versions`}>Back to history</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/workflows/${name}`}>Open editor</Link>
          </Button>
          <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={restoreMutation.isPending}>
            {restoreMutation.isPending ? "Restoring..." : "Restore this version"}
          </Button>
        </div>
      </div>

      <TemplateForm
        mode="edit"
        initialTemplate={formValues}
        readOnly
        stageEditable={false}
        onSubmit={async () => {}}
        onDuplicate={() => {}}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore version v{version}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new version based on this snapshot. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoreMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={restoreMutation.isPending}
              onClick={() => void handleRestore()}
            >
              {restoreMutation.isPending ? "Restoring..." : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
