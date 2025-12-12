// ADR: ADR-007-workflow-orchestration

import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
  BUILTIN_TEMPLATE_NAMES,
  loadTemplate,
  listTemplates,
  validateTemplate,
  type WorkflowTemplate,
  type WorkflowTemplateStage,
} from "./templates.js";
import type { TransitionAction } from "./types.js";

const WORKFLOW_TEMPLATE_DIR = ".choragen/workflow-templates";
const TEMPLATE_VERSION_DIR = ".choragen/workflow-template-versions";

export interface TemplateVersion {
  templateName: string;
  version: number;
  snapshot: WorkflowTemplate;
  changedBy: string;
  changeDescription?: string;
  createdAt: Date;
}

export interface TemplateChangeMeta {
  changedBy?: string;
  changeDescription?: string;
}

interface PersistedTemplateVersion extends Omit<TemplateVersion, "createdAt" | "snapshot"> {
  createdAt: string;
  snapshot: PersistedWorkflowTemplate;
}

type PersistedTemplateStage = Omit<WorkflowTemplateStage, "gate"> & {
  gate: Omit<WorkflowTemplateStage["gate"], "satisfiedAt"> & { satisfiedAt?: string };
};

interface PersistedWorkflowTemplate extends Omit<WorkflowTemplate, "createdAt" | "updatedAt" | "stages"> {
  createdAt: string;
  updatedAt: string;
  stages: PersistedTemplateStage[];
}

export class TemplateManager {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async list(): Promise<WorkflowTemplate[]> {
    const names = await listTemplates(this.projectRoot);
    const templates: WorkflowTemplate[] = [];
    for (const name of names) {
      templates.push(await loadTemplate(this.projectRoot, name));
    }
    return templates;
  }

  async get(name: string): Promise<WorkflowTemplate> {
    return loadTemplate(this.projectRoot, name);
  }

  async create(template: WorkflowTemplate, meta: TemplateChangeMeta = {}): Promise<WorkflowTemplate> {
    if (await this.templateExists(template.name)) {
      throw new Error(`Template ${template.name} already exists`);
    }

    const now = new Date();
    const normalized = validateTemplate({
      ...template,
      builtin: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    await this.writeTemplate(normalized);
    await this.saveVersion(normalized, meta);
    return normalized;
  }

  async update(name: string, changes: Partial<WorkflowTemplate>, meta: TemplateChangeMeta = {}): Promise<WorkflowTemplate> {
    if ("name" in changes && changes.name && changes.name !== name) {
      throw new Error("Template name cannot be changed");
    }

    const current = await this.get(name);
    if (current.builtin && !(await this.hasCustomTemplateFile(name))) {
      throw new Error(`Built-in template ${name} cannot be updated`);
    }

    const now = new Date();
    const updated = validateTemplate({
      ...current,
      ...changes,
      name,
      builtin: current.builtin,
      version: current.version + 1,
      createdAt: current.createdAt,
      updatedAt: now,
    });

    await this.writeTemplate(updated);
    await this.saveVersion(updated, meta);
    return updated;
  }

  async delete(name: string): Promise<void> {
    const customPath = await this.findTemplateFile(name);
    if (!customPath && BUILTIN_TEMPLATE_NAMES.includes(name as (typeof BUILTIN_TEMPLATE_NAMES)[number])) {
      throw new Error(`Built-in template ${name} cannot be deleted`);
    }

    if (!customPath) {
      throw new Error(`Template ${name} not found`);
    }

    await fs.rm(customPath, { force: true });
  }

  async duplicate(sourceName: string, newName: string, meta: TemplateChangeMeta = {}): Promise<WorkflowTemplate> {
    if (await this.templateExists(newName)) {
      throw new Error(`Template ${newName} already exists`);
    }

    const source = await this.get(sourceName);
    const now = new Date();
    const duplicate = validateTemplate({
      ...source,
      name: newName,
      builtin: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    await this.writeTemplate(duplicate);
    await this.saveVersion(duplicate, meta);
    return duplicate;
  }

  async listVersions(name: string): Promise<TemplateVersion[]> {
    await this.ensureVersionDir(name);
    const dir = this.getTemplateVersionDir(name);
    let files: string[];
    try {
      files = await fs.readdir(dir);
    } catch {
      return [];
    }

    const versions: TemplateVersion[] = [];
    for (const file of files.filter((f) => /^v\d+\.ya?ml$/.test(f))) {
      const version = await this.readVersion(path.join(dir, file));
      versions.push(version);
    }

    return versions.sort((a, b) => a.version - b.version);
  }

  async getVersion(name: string, version: number): Promise<TemplateVersion> {
    const filePath = this.getTemplateVersionFile(name, version);
    const exists = await this.fileExists(filePath);
    if (!exists) {
      throw new Error(`Version ${version} for template ${name} not found`);
    }
    return this.readVersion(filePath);
  }

  async restoreVersion(name: string, version: number, changedBy: string, changeDescription?: string): Promise<WorkflowTemplate> {
    const target = await this.getVersion(name, version);
    const versions = await this.listVersions(name);
    const latestVersion = versions.length > 0 ? Math.max(...versions.map((v) => v.version)) : (await this.get(name)).version;

    const now = new Date();
    const restored = validateTemplate({
      ...target.snapshot,
      name,
      version: latestVersion + 1,
      updatedAt: now,
    });

    await this.writeTemplate(restored);
    await this.saveVersion(restored, { changedBy, changeDescription });
    return restored;
  }

  async duplicateVersion(sourceName: string, sourceVersion: number, newName: string, meta: TemplateChangeMeta = {}): Promise<WorkflowTemplate> {
    const snapshot = await this.getVersion(sourceName, sourceVersion);
    return this.create(
      {
        ...snapshot.snapshot,
        name: newName,
      },
      meta
    );
  }

  private async writeTemplate(template: WorkflowTemplate): Promise<void> {
    const content = templateToYaml(template);
    await fs.mkdir(this.getTemplateDir(), { recursive: true });
    await fs.writeFile(this.getTemplateFilePath(template.name), content, "utf-8");
  }

  private async saveVersion(template: WorkflowTemplate, meta: TemplateChangeMeta): Promise<void> {
    const version: TemplateVersion = {
      templateName: template.name,
      version: template.version,
      snapshot: template,
      changedBy: meta.changedBy ?? "system",
      changeDescription: meta.changeDescription,
      createdAt: new Date(),
    };

    await this.ensureVersionDir(template.name);
    const persisted = serializeTemplateVersion(version);
    await fs.writeFile(this.getTemplateVersionFile(template.name, version.version), JSON.stringify(persisted, null, 2), "utf-8");
  }

  private async templateExists(name: string): Promise<boolean> {
    const names = await listTemplates(this.projectRoot);
    return names.includes(name);
  }

  private async findTemplateFile(name: string): Promise<string | null> {
    const candidates = [".yaml", ".yml"].map((ext) => path.join(this.getTemplateDir(), `${name}${ext}`));
    for (const candidate of candidates) {
      if (await this.fileExists(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  private async hasCustomTemplateFile(name: string): Promise<boolean> {
    return (await this.findTemplateFile(name)) !== null;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private getTemplateDir(): string {
    return path.join(this.projectRoot, WORKFLOW_TEMPLATE_DIR);
  }

  private getTemplateFilePath(name: string): string {
    return path.join(this.getTemplateDir(), `${name}.yaml`);
  }

  private getVersionsRoot(): string {
    return path.join(this.projectRoot, TEMPLATE_VERSION_DIR);
  }

  private getTemplateVersionDir(name: string): string {
    return path.join(this.getVersionsRoot(), name);
  }

  private getTemplateVersionFile(name: string, version: number): string {
    return path.join(this.getTemplateVersionDir(name), `v${version}.yaml`);
  }

  private async ensureVersionDir(name: string): Promise<void> {
    await fs.mkdir(this.getTemplateVersionDir(name), { recursive: true });
  }

  private async readVersion(filePath: string): Promise<TemplateVersion> {
    const content = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(content) as PersistedTemplateVersion;
    return reviveTemplateVersion(parsed);
  }
}

function serializeTemplateVersion(version: TemplateVersion): PersistedTemplateVersion {
  return {
    templateName: version.templateName,
    version: version.version,
    changedBy: version.changedBy,
    changeDescription: version.changeDescription,
    createdAt: version.createdAt.toISOString(),
    snapshot: serializeTemplate(version.snapshot),
  };
}

function reviveTemplateVersion(version: PersistedTemplateVersion): TemplateVersion {
  return {
    ...version,
    createdAt: new Date(version.createdAt),
    snapshot: reviveTemplate(version.snapshot),
  };
}

function serializeTemplate(template: WorkflowTemplate): PersistedWorkflowTemplate {
  return {
    ...template,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    stages: template.stages.map((stage) => ({
      ...stage,
      gate: {
        ...stage.gate,
        satisfiedAt: stage.gate.satisfiedAt ? stage.gate.satisfiedAt.toISOString() : undefined,
      },
    })),
  };
}

function reviveTemplate(template: PersistedWorkflowTemplate): WorkflowTemplate {
  return validateTemplate({
    ...template,
    createdAt: new Date(template.createdAt),
    updatedAt: new Date(template.updatedAt),
    stages: template.stages.map((stage) => ({
      ...stage,
      gate: {
        ...stage.gate,
        satisfiedAt: stage.gate.satisfiedAt ? new Date(stage.gate.satisfiedAt) : undefined,
      },
    })),
  });
}

function templateToYaml(template: WorkflowTemplate): string {
  const normalized = validateTemplate(template);
  const lines: string[] = [];
  lines.push(`name: ${formatScalar(normalized.name)}`);
  if (normalized.displayName) lines.push(`displayName: ${formatScalar(normalized.displayName)}`);
  if (normalized.description) lines.push(`description: ${formatScalar(normalized.description)}`);
  lines.push(`builtin: ${normalized.builtin ? "true" : "false"}`);
  lines.push(`version: ${normalized.version}`);
  lines.push(`createdAt: ${normalized.createdAt.toISOString()}`);
  lines.push(`updatedAt: ${normalized.updatedAt.toISOString()}`);
  lines.push("stages:");

  normalized.stages.forEach((stage) => {
    lines.push(`  - name: ${formatScalar(stage.name)}`);
    lines.push(`    type: ${formatScalar(stage.type)}`);
    if (stage.roleId) lines.push(`    roleId: ${formatScalar(stage.roleId)}`);
    if (stage.chainId) lines.push(`    chainId: ${formatScalar(stage.chainId)}`);
    if (stage.sessionId) lines.push(`    sessionId: ${formatScalar(stage.sessionId)}`);
    lines.push("    gate:");
    lines.push(`      type: ${formatScalar(stage.gate.type)}`);
    if (stage.gate.prompt) lines.push(`      prompt: ${formatScalar(stage.gate.prompt)}`);
    if (stage.gate.chainId) lines.push(`      chainId: ${formatScalar(stage.gate.chainId)}`);
    if (stage.gate.commands && stage.gate.commands.length > 0) {
      lines.push("      commands:");
      stage.gate.commands.forEach((command) => lines.push(`        - ${formatScalar(command)}`));
    }
    if (stage.gate.satisfied !== undefined) lines.push(`      satisfied: ${stage.gate.satisfied ? "true" : "false"}`);
    if (stage.gate.satisfiedBy) lines.push(`      satisfiedBy: ${formatScalar(stage.gate.satisfiedBy)}`);
    if (stage.gate.satisfiedAt) lines.push(`      satisfiedAt: ${stage.gate.satisfiedAt.toISOString()}`);

    if (stage.hooks && (stage.hooks.onEnter?.length || stage.hooks.onExit?.length)) {
      lines.push("    hooks:");
      if (stage.hooks.onEnter && stage.hooks.onEnter.length > 0) {
        lines.push("      onEnter:");
        stage.hooks.onEnter.forEach((action) => lines.push(...formatAction(action)));
      }
      if (stage.hooks.onExit && stage.hooks.onExit.length > 0) {
        lines.push("      onExit:");
        stage.hooks.onExit.forEach((action) => lines.push(...formatAction(action)));
      }
    }
  });

  return `${lines.join("\n")}\n`;
}

function formatAction(action: TransitionAction): string[] {
  const lines: string[] = [];
  lines.push(`        - type: ${formatScalar(action.type)}`);
  if (action.command) lines.push(`          command: ${formatScalar(action.command)}`);
  if (action.taskTransition) lines.push(`          taskTransition: ${formatScalar(action.taskTransition)}`);
  if (action.handler) lines.push(`          handler: ${formatScalar(action.handler)}`);
  if (action.blocking !== undefined) lines.push(`          blocking: ${action.blocking ? "true" : "false"}`);
  if (action.fileMove) {
    lines.push("          fileMove:");
    if (action.fileMove.from) lines.push(`            from: ${formatScalar(action.fileMove.from)}`);
    if (action.fileMove.to) lines.push(`            to: ${formatScalar(action.fileMove.to)}`);
  }
  return lines;
}

function formatScalar(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}
