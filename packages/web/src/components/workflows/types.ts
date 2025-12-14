// ADR: ADR-011-web-api-architecture

/**
 * Shared types and constants for workflow components.
 * Extracted to break circular dependency between template-form, stage-list, and stage-editor.
 */

export const STAGE_TYPES = ["request", "design", "review", "implementation", "verification", "ideation"] as const;
export const GATE_TYPES = ["auto", "human_approval", "chain_complete", "verification_pass"] as const;
export type StageType = (typeof STAGE_TYPES)[number];
export type GateType = (typeof GATE_TYPES)[number];

export type StageAction = {
  type: "command" | "task_transition" | "file_move" | "custom";
  command?: string;
  taskTransition?: "start" | "complete" | "approve";
  fileMove?: { from: string; to: string };
  handler?: string;
  blocking?: boolean;
};

export type TemplateStageInput = {
  name: string;
  type: StageType;
  roleId?: string;
  initPrompt?: string;
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

export const DEFAULT_STAGE: TemplateStageInput = {
  name: "implementation",
  type: "implementation",
  gate: { type: "chain_complete" },
};

export interface RoleOption {
  id: string;
  name: string;
  description?: string;
  toolIds: string[];
}

export interface ToolOption {
  id: string;
  name: string;
  description?: string;
}
