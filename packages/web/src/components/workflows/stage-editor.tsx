// ADR: ADR-011-web-api-architecture
"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  STAGE_TYPES,
  GATE_TYPES,
  type StageType,
  type GateType,
  type TemplateStageInput,
  type RoleOption,
  type ToolOption,
} from "./types";

// Re-export types for backward compatibility
export type { RoleOption, ToolOption };

interface StageEditorProps {
  stage: TemplateStageInput;
  index: number;
  editable?: boolean;
  roles: RoleOption[];
  toolsById: Map<string, ToolOption>;
  disableDelete?: boolean;
  onChange: (stage: TemplateStageInput) => void;
  onDelete?: () => void;
}

function GateFields({
  stage,
  editable,
  onChange,
}: {
  stage: TemplateStageInput;
  editable: boolean;
  onChange: (gate: TemplateStageInput["gate"]) => void;
}) {
  if (stage.gate.type === "human_approval") {
    return (
      <div className="space-y-2">
        <Label>Approval prompt</Label>
        {editable ? (
          <Textarea
            value={stage.gate.prompt ?? ""}
            onChange={(event) => onChange({ ...stage.gate, prompt: event.target.value })}
            placeholder="Describe what approval is needed"
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {stage.gate.prompt || "—"}
          </p>
        )}
      </div>
    );
  }

  if (stage.gate.type === "chain_complete") {
    return (
      <div className="space-y-2">
        <Label>Chain ID (optional)</Label>
        {editable ? (
          <Input
            value={stage.gate.chainId ?? ""}
            onChange={(event) => onChange({ ...stage.gate, chainId: event.target.value })}
            placeholder="CHAIN-123"
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {stage.gate.chainId || "—"}
          </p>
        )}
      </div>
    );
  }

  if (stage.gate.type === "verification_pass") {
    const commandsText = (stage.gate.commands ?? []).join("\n");
    return (
      <div className="space-y-2">
        <Label>Verification commands</Label>
        {editable ? (
          <Textarea
            value={commandsText}
            onChange={(event) =>
              onChange({
                ...stage.gate,
                commands: event.target.value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
              })
            }
            placeholder={"pnpm build\npnpm test"}
          />
        ) : (
          <div className="space-y-1 text-sm text-muted-foreground">
            {(stage.gate.commands ?? []).length > 0 ? (
              <ul className="list-disc space-y-1 pl-4">
                {stage.gate.commands?.map((command, idx) => (
                  <li key={idx}>{command}</li>
                ))}
              </ul>
            ) : (
              <p>—</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function HooksPreview({ stage }: { stage: TemplateStageInput }) {
  const hasHooks =
    (stage.hooks?.onEnter && stage.hooks.onEnter.length > 0) ||
    (stage.hooks?.onExit && stage.hooks.onExit.length > 0);

  if (!hasHooks) {
    return <p className="text-sm text-muted-foreground">No hooks configured.</p>;
  }

  return (
    <div className="space-y-3">
      {stage.hooks?.onEnter && stage.hooks.onEnter.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            On Enter
          </p>
          <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {stage.hooks.onEnter.map((hook, idx) => (
              <li key={`enter-${idx}`}>{hook.type}</li>
            ))}
          </ul>
        </div>
      )}
      {stage.hooks?.onExit && stage.hooks.onExit.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            On Exit
          </p>
          <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            {stage.hooks.onExit.map((hook, idx) => (
              <li key={`exit-${idx}`}>{hook.type}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ToolPreview({
  role,
  toolsById,
}: {
  role?: RoleOption;
  toolsById: Map<string, ToolOption>;
}) {
  if (!role || !role.toolIds || role.toolIds.length === 0) {
    return <p className="text-sm text-muted-foreground">No tools assigned.</p>;
  }

  return (
    <ul className="space-y-1 text-sm text-muted-foreground">
      {role.toolIds.map((id) => {
        const tool = toolsById.get(id);
        return (
          <li key={id} className="flex items-start justify-between gap-2">
            <span className="font-medium text-foreground">{tool?.name ?? id}</span>
            {tool?.description && (
              <span className="text-xs text-muted-foreground truncate max-w-xs">
                {tool.description}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function StageEditor({
  stage,
  index,
  editable = true,
  roles,
  toolsById,
  disableDelete = false,
  onChange,
  onDelete,
}: StageEditorProps) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const selectedRole = useMemo(
    () => roles.find((role) => role.id === stage.roleId),
    [roles, stage.roleId]
  );

  const handleStageChange = <K extends keyof TemplateStageInput>(key: K, value: TemplateStageInput[K]) => {
    onChange({ ...stage, [key]: value });
  };

  const handleGateChange = (gate: TemplateStageInput["gate"]) => {
    onChange({ ...stage, gate });
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (disableDelete) return;
    if (window.confirm("Remove this stage?")) {
      onDelete();
    }
  };

  const stageLabel = stage.name || `Stage ${index + 1}`;

  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg leading-tight">{stageLabel}</CardTitle>
          <CardDescription className="font-mono text-xs text-muted-foreground">
            {stage.type}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{stage.type}</Badge>
          {selectedRole && (
            <Badge variant="secondary" className="gap-1">
              {selectedRole.name}
              <span className="text-xs text-muted-foreground">
                ({selectedRole.toolIds.length} tools)
              </span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Stage name</Label>
            <Input
              value={stage.name}
              disabled={!editable}
              onChange={(event) => handleStageChange("name", event.target.value)}
              placeholder="design"
            />
          </div>
          <div className="space-y-2">
            <Label>Stage type</Label>
            {editable ? (
              <Select
                value={stage.type}
                onValueChange={(value) => handleStageChange("type", value as StageType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground capitalize">{stage.type}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Role</Label>
            {editable ? (
              <Select
                value={stage.roleId ?? "none"}
                onValueChange={(value) =>
                  handleStageChange("roleId", value === "none" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span>{role.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {role.toolIds.length} tools
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                {selectedRole ? `${selectedRole.name} (${selectedRole.toolIds.length} tools)` : "—"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Gate type</Label>
            {editable ? (
              <Select
                value={stage.gate.type}
                onValueChange={(value) =>
                  handleGateChange({ ...stage.gate, type: value as GateType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GATE_TYPES.map((gate) => (
                    <SelectItem key={gate} value={gate}>
                      {gate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline">{stage.gate.type}</Badge>
            )}
          </div>
        </div>

        <GateFields stage={stage} editable={editable} onChange={handleGateChange} />

        <div className="space-y-2">
          <Label>Init Prompt</Label>
          {editable ? (
            <Textarea
              value={stage.initPrompt ?? ""}
              onChange={(event) => handleStageChange("initPrompt", event.target.value)}
              placeholder="Instructions injected when this stage activates..."
              rows={4}
            />
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {stage.initPrompt || "—"}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Hooks</Label>
            <Badge variant="outline">
              {(stage.hooks?.onEnter?.length ?? 0) + (stage.hooks?.onExit?.length ?? 0)} actions
            </Badge>
          </div>
          <HooksPreview stage={stage} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold leading-tight">Tools</p>
              <p className="text-xs text-muted-foreground">
                Tools available from the selected role.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setToolsOpen((open) => !open)}>
              {toolsOpen ? "Hide" : "Show"}
            </Button>
          </div>
          {toolsOpen && <ToolPreview role={selectedRole} toolsById={toolsById} />}
        </div>

        {editable && (
          <div className="flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={disableDelete}
            >
              Delete stage
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
