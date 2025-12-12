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
import type { Role } from "./types.js";

export interface CreateRoleInput {
  name: string;
  description?: string;
  toolIds: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  toolIds?: string[];
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
  const roles: Role[] = [];
  const lines = content.split("\n");
  let current: Partial<Role> & { toolIds?: string[] } | null = null;
  let inToolIds = false;

  for (const rawLine of lines) {
    if (rawLine.trim() === "" || rawLine.trim().startsWith("#")) continue;

    const indent = rawLine.search(/\S/);
    const trimmed = rawLine.trim();

    if (indent === 0 && trimmed === "roles:") {
      continue;
    }

    if (indent === 2 && trimmed.startsWith("- ")) {
      if (current) {
        roles.push(finalizeRole(current));
      }
      current = {};
      inToolIds = false;

      const rest = trimmed.slice(2).trim();
      if (rest) {
        const [key, value] = splitKeyValue(rest);
        assignRoleProp(current, key, value);
        inToolIds = key === "toolIds";
      }
      continue;
    }

    if (!current) {
      continue;
    }

    if (indent === 4 && trimmed === "toolIds:") {
      inToolIds = true;
      current.toolIds = current.toolIds ?? [];
      continue;
    }

    if (indent === 4) {
      const [key, value] = splitKeyValue(trimmed);
      assignRoleProp(current, key, value);
      inToolIds = false;
      continue;
    }

    if (inToolIds && indent >= 6 && trimmed.startsWith("- ")) {
      const value = trimmed.slice(2).trim();
      current.toolIds = current.toolIds ?? [];
      current.toolIds.push(value);
    }
  }

  if (current) {
    roles.push(finalizeRole(current));
  }

  return roles;
}

function serializeRolesYaml(roles: Role[]): string {
  const lines: string[] = ["roles:"];

  roles.forEach((role, index) => {
    lines.push(`  - id: ${role.id}`);
    lines.push(`    name: ${role.name}`);
    if (role.description) {
      lines.push(`    description: ${role.description}`);
    }
    lines.push("    toolIds:");
    for (const toolId of role.toolIds) {
      lines.push(`      - ${toolId}`);
    }
    lines.push(`    createdAt: ${role.createdAt.toISOString()}`);
    lines.push(`    updatedAt: ${role.updatedAt.toISOString()}`);

    if (index < roles.length - 1) {
      lines.push("");
    }
  });

  return lines.join("\n");
}

function assignRoleProp(
  target: Partial<Role>,
  key: string,
  value: string
): void {
  if (key === "id") target.id = value;
  if (key === "name") target.name = value;
  if (key === "description") target.description = value;
  if (key === "createdAt") target.createdAt = new Date(value);
  if (key === "updatedAt") target.updatedAt = new Date(value);
  if (key === "toolIds") target.toolIds = [];
}

function finalizeRole(
  partial: Partial<Role> & { toolIds?: string[] }
): Role {
  return {
    id: partial.id ?? "",
    name: partial.name ?? "",
    description: partial.description,
    toolIds: partial.toolIds ?? [],
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
  };
}

function splitKeyValue(line: string): [string, string] {
  const idx = line.indexOf(":");
  if (idx === -1) return [line.trim(), ""];
  return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
}
