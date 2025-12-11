/**
 * Workflow templates
 *
 * Loads workflow templates from .choragen/workflow-templates with
 * built-in defaults for standard/hotfix/documentation.
 *
 * ADR: ADR-011-workflow-orchestration
 * Design: docs/design/core/features/workflow-orchestration.md
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { GATE_TYPES, STAGE_TYPES, type StageGate, type StageType } from "./types.js";

export interface WorkflowTemplateStage {
  name: string;
  type: StageType;
  gate: Omit<StageGate, "satisfied" | "satisfiedBy" | "satisfiedAt"> & Partial<Pick<StageGate, "satisfied" | "satisfiedBy" | "satisfiedAt">>;
  chainId?: string;
  sessionId?: string;
}

export interface WorkflowTemplate {
  name: string;
  stages: WorkflowTemplateStage[];
}

export const BUILTIN_TEMPLATE_NAMES = ["standard", "hotfix", "documentation"] as const;
const WORKFLOW_TEMPLATE_DIR = ".choragen/workflow-templates";

const BUILTIN_TEMPLATES: Record<string, WorkflowTemplate> = {
  standard: {
    name: "standard",
    stages: [
      {
        name: "request",
        type: "request",
        gate: { type: "human_approval", prompt: "CR created. Proceed to design?" },
      },
      {
        name: "design",
        type: "design",
        gate: { type: "human_approval", prompt: "Design complete. Proceed to implementation?" },
      },
      {
        name: "implementation",
        type: "implementation",
        gate: { type: "chain_complete" },
      },
      {
        name: "verification",
        type: "verification",
        gate: {
          type: "verification_pass",
          commands: ["pnpm build", "pnpm test", "pnpm lint"],
        },
      },
      {
        name: "completion",
        type: "review",
        gate: { type: "human_approval", prompt: "All checks pass. Approve and merge?" },
      },
    ],
  },
  hotfix: {
    name: "hotfix",
    stages: [
      {
        name: "request",
        type: "request",
        gate: { type: "human_approval", prompt: "FR created. Proceed directly to implementation?" },
      },
      {
        name: "implementation",
        type: "implementation",
        gate: { type: "chain_complete" },
      },
      {
        name: "verification",
        type: "verification",
        gate: { type: "verification_pass", commands: ["pnpm build", "pnpm test"] },
      },
      {
        name: "completion",
        type: "review",
        gate: { type: "human_approval", prompt: "Hotfix ready. Approve and merge?" },
      },
    ],
  },
  documentation: {
    name: "documentation",
    stages: [
      {
        name: "request",
        type: "request",
        gate: { type: "auto" },
      },
      {
        name: "implementation",
        type: "implementation",
        gate: { type: "chain_complete" },
      },
      {
        name: "completion",
        type: "review",
        gate: { type: "human_approval", prompt: "Documentation updated. Approve?" },
      },
    ],
  },
};

/**
 * Load a workflow template by name from .choragen/workflow-templates,
 * falling back to built-in defaults.
 */
export async function loadTemplate(projectRoot: string, name: string): Promise<WorkflowTemplate> {
  const localTemplate = await loadLocalTemplate(projectRoot, name);
  const template = localTemplate ?? BUILTIN_TEMPLATES[name];
  if (!template) {
    throw new Error(`Template ${name} not found`);
  }
  const validated = validateTemplate(template);
  return validated;
}

/**
 * List available template names (local + built-in)
 */
export async function listTemplates(projectRoot: string): Promise<string[]> {
  const localNames = await readLocalTemplateNames(projectRoot);
  const names = new Set<string>([...BUILTIN_TEMPLATE_NAMES, ...localNames]);
  return Array.from(names).sort();
}

/**
 * Validate a template structure
 */
export function validateTemplate(template: WorkflowTemplate): WorkflowTemplate {
  if (!template.name || typeof template.name !== "string") {
    throw new Error("Template must have a name");
  }
  if (!Array.isArray(template.stages) || template.stages.length === 0) {
    throw new Error(`Template ${template.name} must have at least one stage`);
  }

  template.stages.forEach((stage, idx) => {
    if (!stage.name || typeof stage.name !== "string") {
      throw new Error(`Stage ${idx} in template ${template.name} is missing a name`);
    }
    if (!STAGE_TYPES.includes(stage.type)) {
      throw new Error(`Stage ${stage.name} has invalid type ${stage.type}`);
    }
    if (!stage.gate) {
      throw new Error(`Stage ${stage.name} must define a gate`);
    }
    if (!GATE_TYPES.includes(stage.gate.type)) {
      throw new Error(`Stage ${stage.name} has invalid gate type ${stage.gate.type}`);
    }
    if (stage.gate.type === "verification_pass") {
      if (!stage.gate.commands || stage.gate.commands.length === 0) {
        throw new Error(`Stage ${stage.name} verification_pass gate requires commands`);
      }
    }
  });

  // Normalize satisfied fields to ensure manager receives defaults
  return normalizeTemplate(template);
}

/**
 * Parse a YAML template into a WorkflowTemplate
 */
function parseTemplateYaml(content: string): WorkflowTemplate {
  const template: WorkflowTemplate = { name: "", stages: [] };
  const lines = content.split(/\r?\n/);
  let currentStage: Partial<WorkflowTemplateStage> | null = null;
  let currentGate: Partial<StageGate> | null = null;
  let inCommands = false;

  for (const rawLine of lines) {
    if (!rawLine || rawLine.trim() === "" || rawLine.trim().startsWith("#")) continue;
    const indent = rawLine.search(/\S/);
    const trimmed = rawLine.trim();

    if (indent === 0) {
      inCommands = false;
      currentGate = null;
      currentStage = null;

      if (trimmed.startsWith("name:")) {
        template.name = parseScalar(trimmed.slice("name:".length).trim());
      }
      // stages: marker handled implicitly
      continue;
    }

    // Stage start
    if (indent === 2 && trimmed.startsWith("- ")) {
      inCommands = false;
      currentGate = null;
      const stage: Partial<WorkflowTemplateStage> = { gate: { type: "auto" } as StageGate };
      currentStage = stage;
      template.stages.push(stage as WorkflowTemplateStage);

      const rest = trimmed.slice(2);
      if (rest.includes(":")) {
        const [key, value] = splitKeyValue(rest);
        assignStageProp(stage, key, value);
      }
      continue;
    }

    // Stage properties
    if (indent === 4 && currentStage) {
      if (trimmed === "gate:" || trimmed.startsWith("gate:")) {
        currentGate = (currentStage.gate || { type: "auto" }) as Partial<StageGate>;
        currentStage.gate = currentGate as StageGate;
        const maybeInline = trimmed.replace("gate:", "").trim();
        if (maybeInline) {
          const [key, value] = splitKeyValue(maybeInline);
          assignGateProp(currentGate, key, value);
        }
        inCommands = false;
        continue;
      }

      const [key, value] = splitKeyValue(trimmed);
      assignStageProp(currentStage, key, value);
      continue;
    }

    // Gate properties
    if (indent === 6 && currentGate) {
      if (trimmed === "commands:" || trimmed.startsWith("commands:")) {
        if (!currentGate.commands) currentGate.commands = [];
        const maybeInline = trimmed.replace("commands:", "").trim();
        if (maybeInline) {
          currentGate.commands.push(parseScalar(maybeInline.startsWith("-") ? maybeInline.slice(1).trim() : maybeInline));
        }
        inCommands = true;
        continue;
      }

      const [key, value] = splitKeyValue(trimmed);
      assignGateProp(currentGate, key, value);
      continue;
    }

    // Command items
    if (indent >= 8 && inCommands && currentGate?.commands) {
      if (trimmed.startsWith("- ")) {
        currentGate.commands.push(parseScalar(trimmed.slice(2)));
      }
    }
  }

  return template;
}

async function loadLocalTemplate(projectRoot: string, name: string): Promise<WorkflowTemplate | null> {
  const dir = path.join(projectRoot, WORKFLOW_TEMPLATE_DIR);
  const candidates = [`${name}.yaml`, `${name}.yml`];
  for (const file of candidates) {
    const filePath = path.join(dir, file);
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return parseTemplateYaml(content);
    } catch {
      // continue to next candidate or fallback
    }
  }
  return null;
}

async function readLocalTemplateNames(projectRoot: string): Promise<string[]> {
  const dir = path.join(projectRoot, WORKFLOW_TEMPLATE_DIR);
  try {
    const files = await fs.readdir(dir);
    return files
      .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
      .map((f) => f.replace(/\.ya?ml$/, ""));
  } catch {
    return [];
  }
}

function splitKeyValue(line: string): [string, string] {
  const idx = line.indexOf(":");
  if (idx === -1) return [line.trim(), ""];
  return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
}

function assignStageProp(stage: Partial<WorkflowTemplateStage>, key: string, rawValue: string): void {
  const value = parseScalar(rawValue);
  if (key === "name" || key === "type" || key === "chainId" || key === "sessionId") {
    (stage as Record<string, unknown>)[key] = value;
  }
}

function assignGateProp(gate: Partial<StageGate>, key: string, rawValue: string): void {
  const value = parseScalar(rawValue);
  if (key === "type") gate.type = value as StageGate["type"];
  if (key === "prompt") gate.prompt = value as string;
  if (key === "chainId") gate.chainId = value as string;
  if (key === "satisfied") gate.satisfied = value === "true";
  if (key === "satisfiedBy") gate.satisfiedBy = value as string;
  if (key === "satisfiedAt") gate.satisfiedAt = new Date(String(value));
}

function parseScalar(raw: string): string {
  let value = raw.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value;
}

function normalizeTemplate(template: WorkflowTemplate): WorkflowTemplate {
  return {
    ...template,
    stages: template.stages.map((stage) => ({
      ...stage,
      gate: {
        satisfied: false,
        satisfiedBy: stage.gate.satisfiedBy,
        satisfiedAt: stage.gate.satisfiedAt,
        ...stage.gate,
      },
    })),
  };
}
