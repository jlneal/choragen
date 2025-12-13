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
import {
  GATE_TYPES,
  STAGE_TYPES,
  type StageGate,
  type StageGateOption,
  type StageTransitionHooks,
  type StageType,
  type CommandAction,
  type CustomAction,
  type EmitEventAction,
  type FileMoveAction,
  type PostMessageAction,
  type SpawnAgentAction,
  type TaskTransitionAction,
  type TransitionAction,
} from "./types.js";

export interface WorkflowTemplateStage {
  name: string;
  type: StageType;
  gate: Omit<StageGate, "satisfied" | "satisfiedBy" | "satisfiedAt"> & Partial<Pick<StageGate, "satisfied" | "satisfiedBy" | "satisfiedAt">>;
  roleId?: string;
  hooks?: StageTransitionHooks;
  chainId?: string;
  sessionId?: string;
}

export interface WorkflowTemplate {
  name: string;
  displayName?: string;
  description?: string;
  builtin: boolean;
  version: number;
  stages: WorkflowTemplateStage[];
  createdAt: Date;
  updatedAt: Date;
}

export const BUILTIN_TEMPLATE_NAMES = ["standard", "hotfix", "documentation", "ideation"] as const;
const WORKFLOW_TEMPLATE_DIR = ".choragen/workflow-templates";
const BUILTIN_TEMPLATE_VERSION = 1;
const BUILTIN_TEMPLATE_TIMESTAMP = new Date("2024-01-01T00:00:00Z");
const TRANSITION_ACTION_TYPES: TransitionAction["type"][] = [
  "command",
  "task_transition",
  "file_move",
  "custom",
  "spawn_agent",
  "post_message",
  "emit_event",
];
const TASK_TRANSITIONS: TaskTransitionAction["taskTransition"][] = ["start", "complete", "approve"];

type MutableTransitionAction = { type?: TransitionAction["type"] } & Partial<Omit<CommandAction, "type">> &
  Partial<Omit<TaskTransitionAction, "type">> &
  Partial<Omit<FileMoveAction, "type">> &
  Partial<Omit<CustomAction, "type">> &
  Partial<Omit<SpawnAgentAction, "type">> &
  Partial<Omit<PostMessageAction, "type">> &
  Partial<Omit<EmitEventAction, "type">>;

const BUILTIN_TEMPLATES: Record<string, WorkflowTemplate> = {
  standard: {
    name: "standard",
    displayName: "Standard Workflow",
    description: "Full lifecycle for change requests with design, implementation, verification, and review",
    builtin: true,
    version: BUILTIN_TEMPLATE_VERSION,
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
    createdAt: BUILTIN_TEMPLATE_TIMESTAMP,
    updatedAt: BUILTIN_TEMPLATE_TIMESTAMP,
  },
  hotfix: {
    name: "hotfix",
    displayName: "Hotfix Workflow",
    description: "Accelerated workflow for urgent fixes with minimal stages",
    builtin: true,
    version: BUILTIN_TEMPLATE_VERSION,
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
    createdAt: BUILTIN_TEMPLATE_TIMESTAMP,
    updatedAt: BUILTIN_TEMPLATE_TIMESTAMP,
  },
  documentation: {
    name: "documentation",
    displayName: "Documentation Workflow",
    description: "Streamlined workflow for documentation-only updates",
    builtin: true,
    version: BUILTIN_TEMPLATE_VERSION,
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
    createdAt: BUILTIN_TEMPLATE_TIMESTAMP,
    updatedAt: BUILTIN_TEMPLATE_TIMESTAMP,
  },
  ideation: {
    name: "ideation",
    displayName: "Ideation Workflow",
    description: "Explore and refine ideas into actionable requests",
    builtin: true,
    version: BUILTIN_TEMPLATE_VERSION,
    stages: [
      {
        name: "exploration",
        type: "ideation",
        roleId: "ideation",
        gate: {
          type: "human_approval",
          prompt: "Continue to request creation, or discard this idea?",
          agentTriggered: true,
          options: [
            { label: "Continue", action: "advance" },
            { label: "Discard", action: "discard" },
          ],
        },
      },
      {
        name: "proposal",
        type: "ideation",
        roleId: "ideation",
        gate: {
          type: "human_approval",
          prompt: "Approve these request proposals?",
        },
      },
      {
        name: "creation",
        type: "ideation",
        roleId: "ideation",
        gate: {
          type: "auto",
        },
        hooks: {
          onExit: [
            {
              type: "file_move",
              fileMove: {
                from: "docs/requests/change-requests/draft/*.md",
                to: "docs/requests/change-requests/backlog/",
              },
            },
          ],
        },
      },
    ],
    createdAt: BUILTIN_TEMPLATE_TIMESTAMP,
    updatedAt: BUILTIN_TEMPLATE_TIMESTAMP,
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
    if (stage.gate.options) {
      if (!Array.isArray(stage.gate.options)) {
        throw new Error(`Stage ${stage.name} gate options must be an array`);
      }
      stage.gate.options.forEach((option, optionIndex) => {
        if (!option?.label || typeof option.label !== "string") {
          throw new Error(`Stage ${stage.name} gate option ${optionIndex} requires label`);
        }
        if (!option.action || typeof option.action !== "string") {
          throw new Error(`Stage ${stage.name} gate option ${optionIndex} requires action`);
        }
      });
    }
    if (stage.gate.agentTriggered !== undefined && typeof stage.gate.agentTriggered !== "boolean") {
      throw new Error(`Stage ${stage.name} gate agentTriggered must be a boolean when provided`);
    }
  });

  const normalized = normalizeTemplate(template);

  if (typeof normalized.builtin !== "boolean") {
    throw new Error(`Template ${template.name} must specify builtin flag`);
  }
  if (typeof normalized.version !== "number" || Number.isNaN(normalized.version)) {
    throw new Error(`Template ${template.name} must specify a numeric version`);
  }
  if (!isValidDate(normalized.createdAt) || !isValidDate(normalized.updatedAt)) {
    throw new Error(`Template ${template.name} must specify createdAt and updatedAt dates`);
  }

  normalized.stages.forEach((stage, idx) => {
    if (stage.roleId && typeof stage.roleId !== "string") {
      throw new Error(`Stage ${stage.name} in template ${template.name} has invalid roleId`);
    }
    validateHooks(stage, idx, template.name);
  });

  return normalized;
}

/**
 * Parse a YAML template into a WorkflowTemplate
 */
function parseTemplateYaml(content: string): WorkflowTemplate {
  const template: WorkflowTemplate = {
    name: "",
    displayName: undefined,
    description: undefined,
    builtin: false,
    version: BUILTIN_TEMPLATE_VERSION,
    stages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const lines = content.split(/\r?\n/);
  let currentStage: Partial<WorkflowTemplateStage> | null = null;
  let currentGate: Partial<StageGate> | null = null;
  let currentHooks: StageTransitionHooks | null = null;
  let currentHookSection: keyof StageTransitionHooks | null = null;
  let currentAction: MutableTransitionAction | null = null;
  let inCommands = false;
  let inGateOptions = false;
  let currentGateOption: Partial<StageGateOption> | null = null;
  let inFileMove = false;

  for (const rawLine of lines) {
    if (!rawLine || rawLine.trim() === "" || rawLine.trim().startsWith("#")) continue;
    const indent = rawLine.search(/\S/);
    const trimmed = rawLine.trim();

    if (indent === 0) {
      inCommands = false;
      inGateOptions = false;
      currentGateOption = null;
      inFileMove = false;
      currentGate = null;
      currentStage = null;
      currentHooks = null;
      currentHookSection = null;
      currentAction = null;

      const [key, value] = splitKeyValue(trimmed);
      assignTemplateProp(template, key, value);
      continue;
    }

    // Stage start
    if (indent === 2 && trimmed.startsWith("- ")) {
      inCommands = false;
      inGateOptions = false;
      currentGateOption = null;
      inFileMove = false;
      currentGate = null;
      currentHooks = null;
      currentHookSection = null;
      currentAction = null;
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
        inGateOptions = false;
        currentGateOption = null;
        inFileMove = false;
        currentHooks = null;
        currentHookSection = null;
        currentAction = null;
        continue;
      }

      if (trimmed === "hooks:" || trimmed.startsWith("hooks:")) {
        currentHooks = currentStage.hooks ?? {};
        currentStage.hooks = currentHooks;
        currentHookSection = null;
        currentAction = null;
        inCommands = false;
        inFileMove = false;
        continue;
      }

      const [key, value] = splitKeyValue(trimmed);
      assignStageProp(currentStage, key, value);
      continue;
    }

    if (indent === 6 && currentHooks) {
      if (trimmed === "onEnter:" || trimmed.startsWith("onEnter:")) {
        currentHookSection = "onEnter";
        currentHooks.onEnter = currentHooks.onEnter ?? [];
        currentAction = null;
        inFileMove = false;

        const maybeInline = trimmed.replace("onEnter:", "").trim();
        if (maybeInline) {
          const action: MutableTransitionAction = {};
          const [key, value] = splitKeyValue(maybeInline);
          assignActionProp(action, key, value);
          currentHooks.onEnter.push(action as TransitionAction);
          currentAction = action;
        }
        continue;
      }

      if (trimmed === "onExit:" || trimmed.startsWith("onExit:")) {
        currentHookSection = "onExit";
        currentHooks.onExit = currentHooks.onExit ?? [];
        currentAction = null;
        inFileMove = false;

        const maybeInline = trimmed.replace("onExit:", "").trim();
        if (maybeInline) {
          const action: MutableTransitionAction = {};
          const [key, value] = splitKeyValue(maybeInline);
          assignActionProp(action, key, value);
          currentHooks.onExit.push(action as TransitionAction);
          currentAction = action;
        }
        continue;
      }
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
        inGateOptions = false;
        currentGateOption = null;
        continue;
      }

      if (trimmed === "options:" || trimmed.startsWith("options:")) {
        if (!currentGate.options) currentGate.options = [];
        inGateOptions = true;
        currentGateOption = null;
        continue;
      }

      const [key, value] = splitKeyValue(trimmed);
      assignGateProp(currentGate, key, value);
      inGateOptions = false;
      currentGateOption = null;
      continue;
    }

    if (indent >= 8 && inGateOptions && currentGate) {
      if (trimmed.startsWith("- ")) {
        const option: Partial<StageGateOption> = {};
        const rest = trimmed.slice(2);
        if (rest) {
          const [key, value] = splitKeyValue(rest);
          assignGateOptionProp(option, key, value);
        }
        currentGate.options = currentGate.options ?? [];
        currentGate.options.push(option as StageGateOption);
        currentGateOption = option;
        continue;
      }

      if (currentGateOption) {
        const [key, value] = splitKeyValue(trimmed);
        assignGateOptionProp(currentGateOption, key, value);
      }

      continue;
    }

    if (indent >= 8 && currentHookSection && currentHooks) {
      const actions = currentHookSection === "onEnter" ? currentHooks.onEnter! : currentHooks.onExit!;
      if (trimmed.startsWith("- ")) {
        const action: MutableTransitionAction = {};
        const rest = trimmed.slice(2);
        if (rest) {
          const [key, value] = splitKeyValue(rest);
          assignActionProp(action, key, value);
        }
        actions.push(action as TransitionAction);
        currentAction = action;
        inFileMove = false;
        continue;
      }

      if (currentAction) {
        if (trimmed === "fileMove:" || trimmed.startsWith("fileMove:")) {
          currentAction.fileMove = currentAction.fileMove ?? { from: "", to: "" };
          const inline = trimmed.replace("fileMove:", "").trim();
          if (inline) {
            const [key, value] = splitKeyValue(inline);
            assignFileMoveProp(currentAction, key, value);
          }
          inFileMove = true;
          continue;
        }

        const [key, value] = splitKeyValue(trimmed);
        if (inFileMove) {
          assignFileMoveProp(currentAction, key, value);
        } else {
          assignActionProp(currentAction, key, value);
        }
      }

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

function assignTemplateProp(template: WorkflowTemplate, key: string, rawValue: string): void {
  const value = parseScalar(rawValue);
  if (key === "name") template.name = value;
  if (key === "displayName") template.displayName = value;
  if (key === "description") template.description = value;
  if (key === "builtin") {
    const parsed = parseBoolean(value);
    if (parsed !== undefined) template.builtin = parsed;
  }
  if (key === "version" && rawValue.trim() !== "") {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) template.version = numeric;
  }
  if (key === "createdAt") {
    template.createdAt = parseDateValue(value, template.createdAt);
  }
  if (key === "updatedAt") {
    template.updatedAt = parseDateValue(value, template.updatedAt);
  }
}

function assignStageProp(stage: Partial<WorkflowTemplateStage>, key: string, rawValue: string): void {
  const value = parseScalar(rawValue);
  if (key === "name" || key === "type" || key === "chainId" || key === "sessionId" || key === "roleId") {
    (stage as Record<string, unknown>)[key] = value;
  }
}

function assignGateProp(gate: Partial<StageGate>, key: string, rawValue: string): void {
  const value = parseScalar(rawValue);
  if (key === "type") gate.type = value as StageGate["type"];
  if (key === "prompt") gate.prompt = value as string;
  if (key === "options") gate.options = Array.isArray(gate.options) ? gate.options : [];
  if (key === "chainId") gate.chainId = value as string;
  if (key === "agentTriggered") {
    const parsed = parseBoolean(value);
    gate.agentTriggered = parsed ?? value === "true";
  }
  if (key === "satisfied") {
    const parsed = parseBoolean(value);
    gate.satisfied = parsed ?? value === "true";
  }
  if (key === "satisfiedBy") gate.satisfiedBy = value as string;
  if (key === "satisfiedAt") {
    const parsed = new Date(String(value));
    if (!Number.isNaN(parsed.getTime())) {
      gate.satisfiedAt = parsed;
    }
  }
}

function assignGateOptionProp(option: Partial<StageGateOption>, key: string, rawValue: string): void {
  const value = parseScalar(rawValue);
  if (key === "label") option.label = value as string;
  if (key === "action") option.action = value as string;
}

function assignActionProp(action: MutableTransitionAction, key: string, rawValue: string): void {
  const value = parseScalar(rawValue);
  if (key === "type") action.type = value as TransitionAction["type"];
  if (key === "command") action.command = value as string;
  if (key === "taskTransition") action.taskTransition = value as TaskTransitionAction["taskTransition"];
  if (key === "handler") action.handler = value as string;
  if (key === "blocking") {
    const parsed = parseBoolean(value);
    if (parsed !== undefined) action.blocking = parsed;
  }
}

function assignFileMoveProp(action: MutableTransitionAction, key: string, rawValue: string): void {
  const value = parseScalar(rawValue);
  if (!action.fileMove) action.fileMove = { from: "", to: "" };
  if (key === "from") action.fileMove.from = value as string;
  if (key === "to") action.fileMove.to = value as string;
}

function parseBoolean(raw: string): boolean | undefined {
  const normalized = raw.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return undefined;
}

function parseDateValue(raw: string, fallback: Date): Date {
  const parsed = new Date(String(raw));
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed;
}

function parseScalar(raw: string): string {
  let value = raw.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value;
}

function validateHooks(stage: WorkflowTemplateStage, stageIndex: number, templateName: string): void {
  if (!stage.hooks) return;

  const hookEntries: Array<["onEnter" | "onExit", TransitionAction[] | undefined]> = [
    ["onEnter", stage.hooks.onEnter],
    ["onExit", stage.hooks.onExit],
  ];

  hookEntries.forEach(([hookName, actions]) => {
    if (!actions) return;
    actions.forEach((action, actionIndex) => validateAction(action, stage, hookName, templateName, stageIndex, actionIndex));
  });
}

function validateAction(
  action: TransitionAction,
  stage: WorkflowTemplateStage,
  hookName: "onEnter" | "onExit",
  templateName: string,
  stageIndex: number,
  actionIndex: number
): void {
  if (!action.type || !TRANSITION_ACTION_TYPES.includes(action.type)) {
    throw new Error(
      `Stage ${stage.name} in template ${templateName} hook ${hookName}[${actionIndex}] has invalid action type ${String(action.type)}`
    );
  }

  if (action.type === "command" && !action.command) {
    throw new Error(`Stage ${stage.name} in template ${templateName} hook ${hookName}[${actionIndex}] command requires command`);
  }

  if (action.type === "task_transition") {
    if (!action.taskTransition || !TASK_TRANSITIONS.includes(action.taskTransition)) {
      throw new Error(
        `Stage ${stage.name} in template ${templateName} hook ${hookName}[${actionIndex}] task_transition requires valid taskTransition`
      );
    }
  }

  if (action.type === "file_move") {
    if (!action.fileMove?.from || !action.fileMove.to) {
      throw new Error(
        `Stage ${stage.name} in template ${templateName} hook ${hookName}[${actionIndex}] file_move requires from and to`
      );
    }
  }

  if (action.blocking !== undefined && typeof action.blocking !== "boolean") {
    throw new Error(
      `Stage ${stage.name} in template ${templateName} hook ${hookName}[${actionIndex}] blocking must be boolean`
    );
  }
}

function isValidDate(value: Date): boolean {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function normalizeTemplate(template: WorkflowTemplate): WorkflowTemplate {
  return {
    ...template,
    builtin: template.builtin ?? false,
    version: typeof template.version === "number" && !Number.isNaN(template.version) ? template.version : BUILTIN_TEMPLATE_VERSION,
    createdAt: normalizeDate(template.createdAt),
    updatedAt: normalizeDate(template.updatedAt),
    stages: template.stages.map((stage) => ({
      ...stage,
      hooks: normalizeHooks(stage.hooks),
      gate: {
        ...stage.gate,
        satisfied: stage.gate.satisfied ?? false,
        satisfiedBy: stage.gate.satisfiedBy,
        satisfiedAt: stage.gate.satisfiedAt ? normalizeDate(stage.gate.satisfiedAt) : undefined,
      },
    })),
  };
}

function normalizeHooks(hooks?: StageTransitionHooks): StageTransitionHooks | undefined {
  if (!hooks) return undefined;

  const normalized: StageTransitionHooks = {};
  if (hooks.onEnter) {
    normalized.onEnter = hooks.onEnter.map((action) => normalizeAction(action));
  }
  if (hooks.onExit) {
    normalized.onExit = hooks.onExit.map((action) => normalizeAction(action));
  }
  return normalized;
}

function normalizeAction(action: TransitionAction): TransitionAction {
  const blocking =
    typeof action.blocking === "boolean" ? action.blocking : action.blocking === undefined ? undefined : parseBoolean(String(action.blocking));

  if (action.type === "file_move") {
    return {
      ...action,
      blocking: blocking ?? true,
      fileMove: action.fileMove ? { ...action.fileMove } : action.fileMove,
    };
  }

  return {
    ...action,
    blocking: blocking ?? true,
  };
}

function normalizeDate(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value);
  }
  const parsed = new Date(String(value ?? new Date()));
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}
