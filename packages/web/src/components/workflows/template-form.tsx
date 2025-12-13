// ADR: ADR-011-web-api-architecture
"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StageList } from "./stage-list";

export const STAGE_TYPES = ["request", "design", "review", "implementation", "verification", "ideation"] as const;
export const GATE_TYPES = ["auto", "human_approval", "chain_complete", "verification_pass"] as const;
export type StageType = (typeof STAGE_TYPES)[number];
export type GateType = (typeof GATE_TYPES)[number];

export type TemplateStageInput = {
  name: string;
  type: StageType;
  roleId?: string;
  gate: {
    type: GateType;
    prompt?: string;
    chainId?: string;
    commands?: string[];
    options?: { label: string; action: string }[];
    satisfied?: boolean;
    satisfiedBy?: string;
    satisfiedAt?: string;
  };
  hooks?: {
    onEnter?: StageAction[];
    onExit?: StageAction[];
  };
};

type StageAction = {
  type: "command" | "task_transition" | "file_move" | "custom";
  command?: string;
  taskTransition?: "start" | "complete" | "approve";
  fileMove?: { from: string; to: string };
  handler?: string;
  blocking?: boolean;
};

export interface TemplateFormValues {
  name: string;
  displayName?: string;
  description?: string;
  builtin?: boolean;
  version?: number;
  stages: TemplateStageInput[];
  changedBy?: string;
  changeDescription?: string;
}

export interface TemplateFormProps {
  mode: "create" | "edit";
  initialTemplate: TemplateFormValues;
  readOnly?: boolean;
  stageEditable?: boolean;
  onSubmit: (values: TemplateFormValues) => Promise<void> | void;
  onCancel?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isSubmitting?: boolean;
  isDeleting?: boolean;
  isDuplicating?: boolean;
}

export const DEFAULT_STAGE: TemplateStageInput = {
  name: "implementation",
  type: "implementation",
  gate: { type: "chain_complete" },
};

export function TemplateForm({
  mode,
  initialTemplate,
  readOnly = false,
  stageEditable = false,
  onSubmit,
  onCancel,
  onDelete,
  onDuplicate,
  isSubmitting = false,
  isDeleting = false,
  isDuplicating = false,
}: TemplateFormProps) {
  const [values, setValues] = useState<TemplateFormValues>(initialTemplate);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues(initialTemplate);
  }, [initialTemplate]);

  const isReadOnly = readOnly || values.builtin;
  const disableNameField = mode === "edit" || values.builtin || isReadOnly;

  const handleSubmit = async () => {
    const trimmedName = values.name.trim();
    if (!trimmedName) {
      setError("Template name is required.");
      return;
    }

    if (!values.stages || values.stages.length === 0) {
      setError("At least one stage is required.");
      return;
    }

    for (const stage of values.stages) {
      if (!stage.name.trim()) {
        setError("Each stage must have a name.");
        return;
      }
      if (
        stage.gate.type === "verification_pass" &&
        (!stage.gate.commands || stage.gate.commands.length === 0)
      ) {
        setError("Verification stages must include commands.");
        return;
      }
    }

    setError(null);
    await onSubmit({
      ...values,
      name: trimmedName,
      stages: values.stages.map((stage) => ({
        ...stage,
        name: stage.name.trim(),
        roleId: stage.roleId?.trim() || undefined,
        gate: {
          ...stage.gate,
          prompt: stage.gate.prompt?.trim() || undefined,
          chainId: stage.gate.chainId?.trim() || undefined,
          commands: stage.gate.commands?.map((command) => command.trim()).filter(Boolean),
        },
      })),
      changedBy: values.changedBy?.trim() || undefined,
      changeDescription: values.changeDescription?.trim() || undefined,
    });
  };

  const versionBadge = useMemo(() => {
    if (!values.version) return null;
    return (
      <Badge variant="secondary" className="font-mono">
        v{values.version}
      </Badge>
    );
  }, [values.version]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Template details</CardTitle>
              <CardDescription>
                {isReadOnly
                  ? "Built-in templates are read-only. Duplicate to customize."
                  : "Update template metadata and stage configuration."}
              </CardDescription>
            </div>
            {versionBadge}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                value={values.name}
                disabled={disableNameField}
                onChange={(event) =>
                  setValues({ ...values, name: event.target.value })
                }
                placeholder="unique-template-name"
              />
              <p className="text-xs text-muted-foreground">
                Template names are unique. Built-in templates cannot be renamed.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-display-name">Display name</Label>
              <Input
                id="template-display-name"
                value={values.displayName ?? ""}
                onChange={(event) =>
                  setValues({ ...values, displayName: event.target.value })
                }
                disabled={isReadOnly}
                placeholder="Readable name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={values.description ?? ""}
              onChange={(event) =>
                setValues({ ...values, description: event.target.value })
              }
              disabled={isReadOnly}
              placeholder="Describe when to use this workflow template"
            />
          </div>

          {!isReadOnly && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="changed-by">Changed by</Label>
                <Input
                  id="changed-by"
                  value={values.changedBy ?? ""}
                  onChange={(event) =>
                    setValues({ ...values, changedBy: event.target.value })
                  }
                  placeholder="your-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="change-description">Change description</Label>
                <Input
                  id="change-description"
                  value={values.changeDescription ?? ""}
                  onChange={(event) =>
                    setValues({ ...values, changeDescription: event.target.value })
                  }
                  placeholder="Summary of changes"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Stages</h3>
            <p className="text-sm text-muted-foreground">
              Stages define the workflow flow. Drag to reorder, edit fields, or add new stages.
            </p>
          </div>
          <Badge variant="outline" className="font-mono">
            {values.stages.length} stage{values.stages.length === 1 ? "" : "s"}
          </Badge>
        </div>
        <StageList
          stages={values.stages}
          editable={stageEditable && !isReadOnly}
          onChange={(updated) => setValues({ ...values, stages: updated })}
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {isReadOnly ? (
          <Button onClick={onDuplicate} disabled={isDuplicating}>
            {isDuplicating ? "Duplicating..." : "Duplicate"}
          </Button>
        ) : (
          <>
            <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                onClick={onDelete}
                disabled={isDeleting || isSubmitting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
