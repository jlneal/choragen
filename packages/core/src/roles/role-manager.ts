/**
 * RoleManager
 *
 * Provides CRUD operations for role definitions stored in .choragen/roles/index.yaml
 *
 * Design doc: docs/design/core/features/role-based-tool-access.md
 */

// ADR: ADR-004-agent-role-separation

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { Role, RoleModelConfig } from "./types.js";

export interface CreateRoleInput {
  name: string;
  description?: string;
  toolIds: string[];
  model?: RoleModelConfig;
  systemPrompt?: string;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  toolIds?: string[];
  model?: RoleModelConfig | null;
  systemPrompt?: string | null;
}

export class RoleManager {
  private readonly rolesFilePath: string;

  constructor(private readonly projectRoot: string) {
    this.rolesFilePath = path.join(projectRoot, ".choragen/roles/index.yaml");
  }

  async list(): Promise<Role[]> {
    await this.ensureDefaults();
    return this.loadRoles();
  }

  async get(id: string): Promise<Role | null> {
    await this.ensureDefaults();
    const roles = await this.loadRoles();
    return roles.find((role) => role.id === id) ?? null;
  }

  async create(input: CreateRoleInput): Promise<Role> {
    await this.ensureDefaults();
    const roles = await this.loadRoles();
    const id = slugify(input.name);

    if (roles.some((role) => role.id === id)) {
      throw new Error(`Role with id '${id}' already exists`);
    }

    const now = new Date();
    const role: Role = {
      id,
      name: input.name,
      description: input.description,
      toolIds: [...input.toolIds],
      model: input.model,
      systemPrompt: input.systemPrompt,
      createdAt: now,
      updatedAt: now,
    };

    roles.push(role);
    await this.saveRoles(roles);
    return role;
  }

  async update(id: string, input: UpdateRoleInput): Promise<Role> {
    await this.ensureDefaults();
    const roles = await this.loadRoles();
    const index = roles.findIndex((role) => role.id === id);
    if (index === -1) {
      throw new Error(`Role with id '${id}' not found`);
    }

    const existing = roles[index];
    const updated: Role = {
      ...existing,
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
      toolIds: input.toolIds ? [...input.toolIds] : existing.toolIds,
      model:
        input.model === null
          ? undefined
          : input.model ?? existing.model,
      systemPrompt:
        input.systemPrompt === null
          ? undefined
          : input.systemPrompt ?? existing.systemPrompt,
      updatedAt: new Date(),
    };

    roles[index] = updated;
    await this.saveRoles(roles);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.ensureDefaults();
    const roles = await this.loadRoles();
    const index = roles.findIndex((role) => role.id === id);
    if (index === -1) {
      throw new Error(`Role with id '${id}' not found`);
    }

    roles.splice(index, 1);
    await this.saveRoles(roles);
  }

  async ensureDefaults(): Promise<void> {
    const roles = await this.loadRoles();
    if (roles.length > 0) return;

    const now = new Date();
    const defaults = createDefaultRoles(now);
    await this.saveRoles(defaults);
  }

  private async loadRoles(): Promise<Role[]> {
    try {
      const content = await fs.readFile(this.rolesFilePath, "utf-8");
      return parseRolesYaml(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  private async saveRoles(roles: Role[]): Promise<void> {
    const dir = path.dirname(this.rolesFilePath);
    await fs.mkdir(dir, { recursive: true });
    const yaml = serializeRolesYaml(roles);
    await fs.writeFile(this.rolesFilePath, yaml, "utf-8");
  }
}

function createDefaultRoles(timestamp: Date): Role[] {
  const baseTime = timestamp.toISOString();
  return [
    {
      id: "researcher",
      name: "Researcher",
      description: "Read-only access for exploration and analysis",
      toolIds: [
        "read_file",
        "list_files",
        "search_files",
        "chain:status",
        "task:status",
        "task:list",
      ],
      createdAt: new Date(baseTime),
      updatedAt: new Date(baseTime),
    },
    {
      id: "implementer",
      name: "Implementer",
      description: "Full implementation capabilities",
      toolIds: [
        "read_file",
        "write_file",
        "list_files",
        "search_files",
        "chain:status",
        "task:start",
        "task:complete",
        "task:status",
        "task:list",
        "run_command",
      ],
      createdAt: new Date(baseTime),
      updatedAt: new Date(baseTime),
    },
    {
      id: "reviewer",
      name: "Reviewer",
      description: "Review and approval capabilities",
      toolIds: [
        "read_file",
        "list_files",
        "search_files",
        "chain:status",
        "task:approve",
        "task:status",
        "task:list",
      ],
      createdAt: new Date(baseTime),
      updatedAt: new Date(baseTime),
    },
    {
      id: "controller",
      name: "Controller",
      description: "Orchestration and coordination",
      toolIds: [
        "read_file",
        "list_files",
        "search_files",
        "chain:status",
        "chain:new",
        "task:add",
        "task:status",
        "task:list",
        "spawn_impl_session",
      ],
      createdAt: new Date(baseTime),
      updatedAt: new Date(baseTime),
    },
  ];
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "role";
}

function parseRolesYaml(content: string): Role[] {
  const parsed = parseYaml(content) as
    | {
        roles?: RoleYaml[];
      }
    | null
    | undefined;

  const roles = Array.isArray(parsed?.roles) ? parsed?.roles : [];
  return roles.map((role) => finalizeRole(role));
}

function serializeRolesYaml(roles: Role[]): string {
  const payload = {
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      model: role.model ? { ...role.model } : undefined,
      systemPrompt: role.systemPrompt,
      toolIds: [...role.toolIds],
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    })),
  };

  return stringifyYaml(payload, { lineWidth: 0 });
}

function finalizeRole(role: RoleYaml): Role {
  return {
    id: role.id ?? "",
    name: role.name ?? "",
    description: role.description,
    model: normalizeModel(role.model),
    systemPrompt: typeof role.systemPrompt === "string" ? role.systemPrompt : undefined,
    toolIds: role.toolIds ? [...role.toolIds] : [],
    createdAt: role.createdAt ? new Date(role.createdAt) : new Date(),
    updatedAt: role.updatedAt ? new Date(role.updatedAt) : new Date(),
  };
}

function normalizeModel(model: RoleYamlModel | undefined): RoleModelConfig | undefined {
  if (!model) {
    return undefined;
  }

  if (
    typeof model.provider !== "string" ||
    typeof model.model !== "string" ||
    model.temperature === undefined
  ) {
    return undefined;
  }

  const temperature = Number(model.temperature);
  const maxTokens =
    model.maxTokens === undefined ? undefined : Number(model.maxTokens);

  if (Number.isNaN(temperature)) {
    return undefined;
  }

  return {
    provider: model.provider,
    model: model.model,
    temperature,
    maxTokens: Number.isNaN(maxTokens ?? 0) ? undefined : maxTokens,
    options: model.options,
  };
}

interface RoleYamlModel {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  options?: Record<string, unknown>;
}

interface RoleYaml {
  id?: string;
  name?: string;
  description?: string;
  model?: RoleYamlModel;
  systemPrompt?: string;
  toolIds?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
